import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { whatsappService } from '../src/services/whatsapp/whatsappService.js';
import { MetaWhatsAppProvider } from '../src/services/whatsapp/metaWhatsAppProvider.js';
import { MockWhatsAppProvider } from '../src/services/whatsapp/mockWhatsAppProvider.js';
import { SOSIncident } from '../src/models/SOSIncident.js';

let server;
let baseUrl;
let testToken;
let testUserId;
let testUserPhone = '+919876543210';
let otherUserToken;
let testContactId;
let testIncidentId;

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, body: data };
};

describe('Signal Bridge WhatsApp Cloud API Isolation & Notification Suite', () => {
  before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongoUri);
    }
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    // Create primary test user
    const email = `wa_test_${Date.now()}@signalbridge.test`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'WhatsApp Test User',
        email,
        password: 'password123',
        phone: testUserPhone
      }
    });
    testToken = regRes.body.token;
    testUserId = regRes.body.user._id;

    // Create second user for isolation checks
    const otherEmail = `wa_other_${Date.now()}@signalbridge.test`;
    const otherRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Other WhatsApp User',
        email: otherEmail,
        password: 'password123',
        phone: '+919876500000'
      }
    });
    otherUserToken = otherRes.body.token;

    // Add emergency contact
    const contactRes = await request('/api/contacts', {
      method: 'POST',
      token: testToken,
      body: {
        name: 'Emergency WhatsApp Contact',
        relationship: 'Sibling',
        phone: '+919876543212',
        email: 'contact_wa@test.com',
        notifyInEmergency: true
      }
    });
    testContactId = contactRes.body.contact._id;
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  });

  // 1. Authenticated test endpoint protection
  it('POST /api/whatsapp/test blocks unauthenticated requests (401)', async () => {
    const res = await request('/api/whatsapp/test', {
      method: 'POST',
      body: { to: '+919876543210' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  // 2. Safe GET /api/whatsapp/status endpoint
  it('GET /api/whatsapp/status returns status metadata and never leaks secrets', async () => {
    const res = await request('/api/whatsapp/status', {
      token: testToken
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(typeof res.body.enabled, 'boolean');
    assert.strictEqual(typeof res.body.demoMode, 'boolean');
    assert.strictEqual(typeof res.body.configured, 'boolean');
    assert.ok(res.body.apiVersion);
    assert.strictEqual(res.body.whatsappAccessToken, undefined);
    assert.strictEqual(res.body.accessToken, undefined);
  });

  // 3. Demo mode isolation check
  it('DEMO_MODE=true safely simulates test WhatsApp dispatch without external network calls', async () => {
    assert.strictEqual(config.demoMode, true, 'Tests must run in DEMO_MODE=true by default');

    const res = await request('/api/whatsapp/test', {
      method: 'POST',
      token: testToken,
      body: { to: testUserPhone }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'simulated');
    assert.strictEqual(res.body.channel, 'simulated_whatsapp');
    assert.strictEqual(res.body.isDemoSimulated, true);
    assert.ok(res.body.providerMessageId.startsWith('sim_wa_test_'));
  });

  // 4. Safety isolation: Test endpoint must never create SOS incident, send SMS, or call 112
  it('POST /api/whatsapp/test strictly does NOT create persistent SOS incidents or call 112', async () => {
    const incidentsBefore = await SOSIncident.countDocuments({ userId: testUserId });

    const res = await request('/api/whatsapp/test', {
      method: 'POST',
      token: testToken,
      body: { to: testUserPhone }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const incidentsAfter = await SOSIncident.countDocuments({ userId: testUserId });
    assert.strictEqual(incidentsAfter, incidentsBefore, 'WhatsApp test must NEVER create an SOS incident');
  });

  // 5. Input validation: missing or invalid recipient numbers
  it('POST /api/whatsapp/test rejects invalid or malformed phone numbers (400)', async () => {
    // Missing phone in body and user profile
    const emptyRes = await request('/api/whatsapp/test', {
      method: 'POST',
      token: otherUserToken,
      body: { to: '' }
    });
    // otherUser has phone in profile, so if to is explicitly short e.g. "123"
    const shortRes = await request('/api/whatsapp/test', {
      method: 'POST',
      token: testToken,
      body: { to: '123' }
    });

    assert.strictEqual(shortRes.status, 400);
    assert.strictEqual(shortRes.body.success, false);
    assert.strictEqual(shortRes.body.blocker, 'INVALID_PHONE_FORMAT');
  });

  // 6. Production allowlist enforcement
  it('Production mode blocks non-allowlisted arbitrary recipients (403)', async () => {
    const origDemo = config.demoMode;
    const origEnv = config.nodeEnv;
    const origAllowlist = config.whatsappTestAllowlist;

    try {
      config.demoMode = false;
      config.nodeEnv = 'production';
      config.whatsappTestAllowlist = ['919876543210']; // Only test user's number is allowed

      // Attempt to send test message to arbitrary unapproved number
      const res = await request('/api/whatsapp/test', {
        method: 'POST',
        token: testToken,
        body: { to: '+919999988888' }
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.blocker, 'RESTRICTED_ALLOWLIST');
    } finally {
      config.demoMode = origDemo;
      config.nodeEnv = origEnv;
      config.whatsappTestAllowlist = origAllowlist;
    }
  });

  // 7. Missing credentials reporting in production mode
  it('Production mode reports missing credentials with 503 MISSING_PROVIDER_CREDENTIALS', async () => {
    const origDemo = config.demoMode;
    const origEnabled = config.whatsappEnabled;
    const origToken = config.whatsappAccessToken;
    const origPhoneId = config.whatsappPhoneNumberId;

    try {
      config.demoMode = false;
      config.whatsappEnabled = true;
      config.whatsappAccessToken = '';
      config.whatsappPhoneNumberId = '';

      const res = await request('/api/whatsapp/test', {
        method: 'POST',
        token: testToken,
        body: { to: testUserPhone }
      });

      assert.strictEqual(res.status, 503);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.blocker, 'MISSING_PROVIDER_CREDENTIALS');
      assert.ok(res.body.message.includes('WHATSAPP_ACCESS_TOKEN'));
    } finally {
      config.demoMode = origDemo;
      config.whatsappEnabled = origEnabled;
      config.whatsappAccessToken = origToken;
      config.whatsappPhoneNumberId = origPhoneId;
    }
  });

  // 8. MetaWhatsAppProvider fails safely when credentials are missing
  it('MetaWhatsAppProvider fails safely if credentials are not provided', async () => {
    const emptyProvider = new MetaWhatsAppProvider({ accessToken: '', phoneNumberId: '' });
    const result = await emptyProvider.sendMessage({
      to: '+919876543210',
      message: 'Test message'
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.providerMessageId, null);
    assert.strictEqual(result.status, 'failed');
    assert.ok(result.error.includes('Meta WhatsApp credentials missing'));
  });

  // 9. MetaWhatsAppProvider phone normalization
  it('MetaWhatsAppProvider normalizes 10-digit Indian numbers and E.164 strings', () => {
    const provider = new MetaWhatsAppProvider();

    // 10 digits
    assert.strictEqual(provider.normalizePhoneNumber('9876543210'), '919876543210');
    // +91 with spaces
    assert.strictEqual(provider.normalizePhoneNumber('+91 98765 43210'), '919876543210');
    // 11 digits starting with 0
    assert.strictEqual(provider.normalizePhoneNumber('09876543210'), '919876543210');
    // US number
    assert.strictEqual(provider.normalizePhoneNumber('+1 (415) 555-2671'), '14155552671');
  });

  // 10. Message formatting omits sensitive medical notes
  it('formatWhatsAppMessage omits sensitive medical data and includes urgent alert & live map link', () => {
    const msg = whatsappService.formatWhatsAppMessage({
      incident: {
        incidentNumber: 'SB-2026-9999',
        category: 'Medical Emergency',
        description: 'Need help near central park',
        location: { lat: 28.6139, lng: 77.2090 },
        createdAt: new Date('2026-10-24T12:00:00Z')
      },
      user: {
        name: 'Aarav Sharma',
        medicalNotes: 'CONFIDENTIAL: Type 1 Diabetes, taking insulin daily'
      },
      recipientName: 'Priya'
    });

    assert.ok(msg.includes('SIGNAL BRIDGE EMERGENCY ALERT'));
    assert.ok(msg.includes('Aarav Sharma'));
    assert.ok(msg.includes('Medical Emergency'));
    assert.ok(msg.includes('SB-2026-9999'));
    assert.ok(msg.includes('*Live Map:* https://maps.google.com/?q=28.61390,77.20900'));
    assert.ok(msg.includes('https://maps.google.com/?q=28.61390,77.20900'));
    // Must NOT contain sensitive medical notes
    assert.strictEqual(msg.includes('Diabetes'), false);
    assert.strictEqual(msg.includes('insulin'), false);
  });

  // 11. SOS dispatch creates WhatsApp recipient records when WHATSAPP_ENABLED=true
  it('POST /api/sos dispatches WhatsApp alerts alongside SMS when WHATSAPP_ENABLED=true', async () => {
    const origEnabled = config.whatsappEnabled;
    try {
      config.whatsappEnabled = true;

      const res = await request('/api/sos', {
        method: 'POST',
        token: testToken,
        body: {
          category: 'Accident',
          description: 'Car breakdown on highway, immediate assistance requested',
          location: { lat: 19.0760, lng: 72.8777 }
        }
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      testIncidentId = res.body.incident._id;

      const recipients = res.body.incident.recipients;
      assert.ok(recipients.length >= 2, 'Should include both SMS and WhatsApp recipients');

      const waRecipient = recipients.find((r) => r.channel.includes('whatsapp'));
      assert.ok(waRecipient, 'Must contain a WhatsApp recipient record');
      assert.strictEqual(waRecipient.name, 'Emergency WhatsApp Contact');
      assert.strictEqual(waRecipient.status, 'simulated');
      assert.strictEqual(waRecipient.isDemoSimulated, true);
      assert.ok(waRecipient.providerMessageId.startsWith('sim_wa_'));
    } finally {
      config.whatsappEnabled = origEnabled;
    }
  });

  // 12. Contact ownership isolation: cannot trigger SOS targeting other user contacts
  it('SOS dispatch only queries emergency contacts belonging to authenticated user', async () => {
    const origEnabled = config.whatsappEnabled;
    try {
      config.whatsappEnabled = true;

      const res = await request('/api/sos', {
        method: 'POST',
        token: otherUserToken,
        body: {
          category: 'Personal Safety',
          description: 'Testing contact isolation',
          selectedContactIds: [testContactId]
        }
      });

      assert.strictEqual(res.status, 201);
      // otherUser has no contacts, so recipients must be empty
      assert.strictEqual(res.body.incident.recipients.length, 0);
    } finally {
      config.whatsappEnabled = origEnabled;
    }
  });

  // 13. Deduplication prevention prevents duplicate dispatches within 60s
  it('Duplicate notification prevention detects rapid subsequent dispatches', async () => {
    const key = `test_dedup_${Date.now()}`;
    const firstCheck = whatsappService.isDuplicate(key);
    assert.strictEqual(firstCheck, false, 'First check should not be a duplicate');

    const secondCheck = whatsappService.isDuplicate(key);
    assert.strictEqual(secondCheck, true, 'Second check within 60s must be flagged as duplicate');
  });

  // 14. MockWhatsAppProvider error and timeout simulation
  it('MockWhatsAppProvider handles simulated provider failure and timeout gracefully', async () => {
    const mock = new MockWhatsAppProvider();

    // Test failure
    mock.setShouldFail(true, 'Meta Cloud API rate limit exceeded');
    const failRes = await mock.sendMessage({ to: '+919876543210', message: 'test' });
    assert.strictEqual(failRes.success, false);
    assert.strictEqual(failRes.status, 'failed');
    assert.ok(failRes.error.includes('Meta Cloud API rate limit exceeded'));

    // Test timeout
    mock.setShouldFail(false);
    mock.setShouldTimeout(true);
    const timeoutRes = await mock.sendMessage({ to: '+919876543210', message: 'test' });
    assert.strictEqual(timeoutRes.success, false);
    assert.strictEqual(timeoutRes.status, 'failed');
    assert.ok(timeoutRes.error.includes('timed out'));

    // Test success restoration
    mock.setShouldTimeout(false);
    const okRes = await mock.sendMessage({ to: '+919876543210', message: 'test' });
    assert.strictEqual(okRes.success, true);
    assert.strictEqual(okRes.status, 'accepted_by_provider');
    assert.ok(okRes.providerMessageId.startsWith('wamid.'));
  });

  // 15. Accurate status handling: accepted_by_provider vs delivered
  it('Provider acceptance records accepted_by_provider, never false delivered', async () => {
    const mock = new MockWhatsAppProvider();
    const res = await mock.sendMessage({ to: '+919876543210', message: 'test' });

    assert.strictEqual(res.status, 'accepted_by_provider');
    assert.notStrictEqual(res.status, 'delivered', 'Must not mark message delivered merely because API accepted it');
  });
});
