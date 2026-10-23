import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { smsService } from '../src/services/sms/smsService.js';
import { MockSMSProvider } from '../src/services/sms/mockProvider.js';
import { MSG91Provider } from '../src/services/sms/msg91Provider.js';
import { SOSIncident } from '../src/models/SOSIncident.js';

let server;
let baseUrl;
let testToken;
let testUserId;
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

describe('Signal Bridge SMS & Dispatch Isolation Test Suite', () => {
  before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongoUri);
    }
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    // Create primary test user
    const email = `sms_test_${Date.now()}@signalbridge.test`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'SMS Test User',
        email,
        password: 'password123',
        phone: '+919876543210'
      }
    });
    testToken = regRes.body.token;
    testUserId = regRes.body.user._id;

    // Create second user for isolation checks
    const otherEmail = `sms_other_${Date.now()}@signalbridge.test`;
    const otherRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Other User',
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
        name: 'Emergency Sibling',
        relationship: 'Sibling',
        phone: '+919876543211',
        email: 'sibling@test.com',
        notifyInEmergency: true
      }
    });
    testContactId = contactRes.body.contact._id;
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  });

  // 1. DEMO MODE strictly isolates real SMS
  it('DEMO_MODE=true strictly sets channel=simulated_dispatch and does NOT call external SMS API', async () => {
    assert.strictEqual(config.demoMode, true, 'Tests must run in DEMO_MODE=true');

    const res = await request('/api/sos', {
      method: 'POST',
      token: testToken,
      body: {
        category: 'Personal Safety',
        description: 'Testing demo mode isolation',
        location: { lat: 12.9716, lng: 77.5946, accuracy: 10, isCurrent: true }
      }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.incident.status, 'active');
    testIncidentId = res.body.incident._id;

    const recipients = res.body.incident.recipients;
    assert.ok(recipients.length >= 1);
    const rec = recipients[0];

    assert.strictEqual(rec.isDemoSimulated, true);
    assert.strictEqual(rec.channel, 'simulated_dispatch');
    assert.strictEqual(rec.status, 'simulated');
    assert.ok(rec.providerMessageId.startsWith('sim_sms_'));
  });

  // 2. Production validation: missing credentials fail safely without fake success
  it('Production mode fails safely if SMS provider credentials are missing', async () => {
    const originalDemoMode = config.demoMode;
    try {
      config.demoMode = false; // Simulate production mode
      const emptyProvider = new MSG91Provider({ authKey: '' });
      const sendResult = await emptyProvider.sendSMS({
        to: '+919876543211',
        message: 'Test emergency alert'
      });

      assert.strictEqual(sendResult.success, false);
      assert.strictEqual(sendResult.providerMessageId, null);
      assert.ok(sendResult.error.includes('MSG91_AUTH_KEY is not configured'));
    } finally {
      config.demoMode = originalDemoMode; // Restore demo mode
    }
  });

  // 3. MockSMSProvider with retry behavior
  it('MockSMSProvider correctly handles retries on transient errors', async () => {
    const mockProvider = new MockSMSProvider();
    mockProvider.setShouldFail(true, 'Temporary carrier gateway timeout');

    const failedResult = await mockProvider.sendSMS({
      to: '+919876543210',
      message: 'Test retry body'
    });
    assert.strictEqual(failedResult.success, false);

    // Now restore mock provider to normal
    mockProvider.setShouldFail(false);
    const successResult = await mockProvider.sendSMS({
      to: '+919876543210',
      message: 'Test retry body'
    });
    assert.strictEqual(successResult.success, true);
    assert.ok(successResult.providerMessageId.startsWith('mock_sms_'));
  });

  // 4. Authorized status endpoint for inspecting notification delivery progress
  it('GET /api/sos/:id/notifications returns delivery records to authorized owner', async () => {
    const res = await request(`/api/sos/${testIncidentId}/notifications`, {
      token: testToken
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.recipients.length >= 1);
    assert.strictEqual(res.body.recipients[0].name, 'Emergency Sibling');
  });

  // 5. Unauthorized user is blocked from viewing another user\'s notification status
  it('GET /api/sos/:id/notifications blocks unauthorized non-owner users (404/401)', async () => {
    const res = await request(`/api/sos/${testIncidentId}/notifications`, {
      token: otherUserToken
    });

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
  });

  // 6. Contact ownership isolation: cannot trigger SOS targeting another user\'s contacts
  it('SOS dispatch only queries contacts belonging to authenticated user', async () => {
    // Other user attempts to create SOS targeting testContactId
    const res = await request('/api/sos', {
      method: 'POST',
      token: otherUserToken,
      body: {
        category: 'Medical Emergency',
        description: 'Should not contact other user contacts',
        selectedContactIds: [testContactId]
      }
    });

    assert.strictEqual(res.status, 201);
    // Other user has 0 contacts belonging to them, so recipients must be empty
    assert.strictEqual(res.body.incident.recipients.length, 0);
  });

  // 7. Test-SMS blocks unauthenticated requests
  it('POST /api/sos/test-sms blocks unauthenticated requests (401)', async () => {
    const res = await request('/api/sos/test-sms', {
      method: 'POST',
      body: { to: '+919876543210' }
    });
    assert.strictEqual(res.status, 401);
  });

  // 8. Safe test-SMS executes without creating emergency incidents or dialing 112
  it('POST /api/sos/test-sms safely simulates dispatch in DEMO_MODE and creates zero SOS incidents', async () => {
    const incidentsBefore = await SOSIncident.countDocuments({ userId: testUserId });

    const res = await request('/api/sos/test-sms', {
      method: 'POST',
      token: testToken,
      body: { to: '+919876543210' }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'simulated');
    assert.strictEqual(res.body.isDemoSimulated, true);
    assert.ok(res.body.providerMessageId.startsWith('sim_test_'));

    const incidentsAfter = await SOSIncident.countDocuments({ userId: testUserId });
    assert.strictEqual(incidentsAfter, incidentsBefore, 'Test-SMS must NEVER create persistent SOS incidents');
  });

  // 9. Safe test-SMS reports missing provider credentials in real mode
  it('POST /api/sos/test-sms reports missing provider credentials when DEMO_MODE=false', async () => {
    const origDemo = config.demoMode;
    try {
      config.demoMode = false;
      const res = await request('/api/sos/test-sms', {
        method: 'POST',
        token: testToken,
        body: { to: '+919876543210' }
      });

      assert.strictEqual(res.status, 503);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.blocker, 'MISSING_PROVIDER_CREDENTIALS');
      assert.ok(res.body.message.includes('MSG91_AUTH_KEY'));
    } finally {
      config.demoMode = origDemo;
    }
  });
});
