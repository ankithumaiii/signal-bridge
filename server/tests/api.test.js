import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config/env.js';

let server;
let baseUrl;
let testToken;
let testUserId;
let testContactId;
let testIncidentId;
let testHazardId;

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

describe('Signal Bridge API Test Suite', () => {
  before(async () => {
    // Connect DB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }

    // Start ephemeral test server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close();
  });

  // 1. Health check
  it('GET /api/health should return 200 and healthy status', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
    assert.strictEqual(res.body.service, 'Signal Bridge API Engine');
  });

  // 2. Authentication
  it('POST /api/auth/register creates a new user', async () => {
    const testEmail = `test_${Date.now()}@signalbridge.test`;
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Automated Tester',
        email: testEmail,
        password: 'password123',
        phone: '+919999900001'
      }
    });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.name, 'Automated Tester');
    assert.strictEqual(res.body.user.email, testEmail);

    testToken = res.body.token;
    testUserId = res.body.user._id;
  });

  it('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'demo@signalbridge.org',
        password: 'demo12345'
      }
    });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, 'demo@signalbridge.org');
  });

  it('POST /api/auth/login fails with invalid credentials', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'demo@signalbridge.org',
        password: 'wrongpassword'
      }
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/auth/me returns 401 when no token is provided', async () => {
    const res = await request('/api/auth/me');
    assert.strictEqual(res.status, 401);
  });

  it('GET /api/auth/me returns current user with valid token', async () => {
    const res = await request('/api/auth/me', { token: testToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user._id, testUserId);
  });

  // 3. Contacts
  it('POST /api/contacts creates a trusted contact', async () => {
    const res = await request('/api/contacts', {
      method: 'POST',
      token: testToken,
      body: {
        name: 'Sister Ananya',
        relationship: 'Sibling',
        phone: '+919876599999',
        email: 'ananya@test.com',
        notifyInEmergency: true
      }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.contact.name, 'Sister Ananya');
    testContactId = res.body.contact._id;
  });

  it('GET /api/contacts retrieves user contacts', async () => {
    const res = await request('/api/contacts', { token: testToken });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.contacts.length >= 1);
  });

  it('POST /api/contacts/checkin updates check-in state', async () => {
    const res = await request('/api/contacts/checkin', {
      method: 'POST',
      token: testToken,
      body: {
        status: 'safe',
        message: 'Checked in safely from test suite.',
        location: { lat: 12.9716, lng: 77.5946, accuracy: 10 }
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  // 4. Emergency SOS
  it('POST /api/sos triggers persistent emergency incident', async () => {
    const res = await request('/api/sos', {
      method: 'POST',
      token: testToken,
      body: {
        category: 'Medical Emergency',
        description: 'Test emergency asthma trigger in test suite.',
        location: {
          lat: 12.9716,
          lng: 77.5946,
          accuracy: 8,
          isCurrent: true,
          address: 'Cubbon Park Test Point'
        }
      }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.incident.status, 'active');
    assert.ok(res.body.incident.incidentNumber.startsWith('SB-2026-'));
    assert.ok(res.body.emergencySummary.includes('SIGNAL BRIDGE EMERGENCY ALERT'));
    testIncidentId = res.body.incident._id;
  });

  it('POST /api/sos/call-112 logs user initiation of emergency call', async () => {
    const res = await request('/api/sos/call-112', {
      method: 'POST',
      token: testToken,
      body: {
        incidentId: testIncidentId,
        notes: 'User pressed Call 112'
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.emergencyServicesAction.status, 'call_action_initiated_by_user');
  });

  // 5. Hazard Reporting and Transparent Verification
  it('POST /api/hazards creates new hazard and runs verification', async () => {
    const isolatedLat = 13.5000 + (Math.random() * 0.05);
    const isolatedLng = 77.1000 + (Math.random() * 0.05);

    const res = await request('/api/hazards', {
      method: 'POST',
      token: testToken,
      body: {
        category: 'Fire or Smoke',
        severity: 'High',
        description: 'Electrical transformer sparking on 5th cross road.',
        location: {
          lat: isolatedLat,
          lng: isolatedLng,
          address: '5th Cross Test Road'
        }
      }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.hazard.category, 'Fire or Smoke');
    testHazardId = res.body.hazard._id;
    assert.ok(testHazardId, 'Hazard ID must be returned');
    assert.ok(['Unverified Report', 'Multiple Reports', 'Corroborated Hazard'].includes(res.body.hazard.status));
  });

  it('GET /api/hazards retrieves safety map hazards', async () => {
    const res = await request('/api/hazards');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.hazards.length >= 1);
  });

  it('POST /api/hazards/:id/corroborate updates verification status', async () => {
    // Corroborate with another user (demo user)
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'demo@signalbridge.org', password: 'demo12345' }
    });
    const demoToken = loginRes.body.token;

    const res = await request(`/api/hazards/${testHazardId}/corroborate`, {
      method: 'POST',
      token: demoToken,
      body: { note: 'Confirmed thick smoke seen from my balcony.' }
    });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.hazard.corroborations.length >= 2);
  });

  // 6. Family Messaging & Idempotency
  it('GET /api/messages/conversations returns or initializes family circle', async () => {
    const res = await request('/api/messages/conversations', { token: testToken });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.conversations.length >= 1);
  });

  it('POST /api/messages/conversations/:id/messages handles idempotency keys', async () => {
    const convRes = await request('/api/messages/conversations', { token: testToken });
    const convId = convRes.body.conversations[0]._id;
    const testIdempotencyKey = `idem_${Date.now()}_abc`;

    // First message submission
    const res1 = await request(`/api/messages/conversations/${convId}/messages`, {
      method: 'POST',
      token: testToken,
      body: {
        text: 'Checking in during test suite execution.',
        messageType: 'text',
        idempotencyKey: testIdempotencyKey
      }
    });
    assert.strictEqual(res1.status, 201);
    assert.strictEqual(res1.body.data.text, 'Checking in during test suite execution.');

    // Duplicate submission with same idempotency key (simulating network reconnect replay)
    const res2 = await request(`/api/messages/conversations/${convId}/messages`, {
      method: 'POST',
      token: testToken,
      body: {
        text: 'Checking in during test suite execution.',
        messageType: 'text',
        idempotencyKey: testIdempotencyKey
      }
    });
    assert.strictEqual(res2.status, 200);
    assert.ok(res2.body.message.includes('idempotent submission'));
  });

  // 7. Dashboard Stats
  it('GET /api/dashboard/stats returns real aggregated data', async () => {
    const res = await request('/api/dashboard/stats', { token: testToken });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.stats.contacts);
    assert.ok(res.body.stats.hazards);
  });
});
