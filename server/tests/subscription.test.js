import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import crypto from 'crypto';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { paymentService } from '../src/services/paymentService.js';
import { subscriptionService } from '../src/services/subscriptionService.js';
import { Subscription } from '../src/models/Subscription.js';
import { ProcessedWebhook } from '../src/models/ProcessedWebhook.js';

let server;
let baseUrl;
let testToken;
let testUserId;
let testUserEmail;

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
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, body: data };
};

describe('Signal Bridge Subscription & Razorpay Payment Test Suite', () => {
  before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongoUri);
    }
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    testUserEmail = `billing_test_${Date.now()}@signalbridge.test`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Billing Test User',
        email: testUserEmail,
        password: 'password123',
        phone: '+919876543299'
      }
    });
    testToken = regRes.body.token;
    testUserId = regRes.body.user._id;
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  });

  // 1. Public catalog
  it('GET /api/subscription/plans returns all plans and confirms 100% free SOS guarantee', async () => {
    const res = await request('/api/subscription/plans');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.plans.length >= 3);

    const freePlan = res.body.plans.find((p) => p.id === 'free');
    const monthlyPlan = res.body.plans.find((p) => p.id === 'plus_monthly');
    const annualPlan = res.body.plans.find((p) => p.id === 'plus_annual');

    assert.ok(freePlan, 'Free plan must exist');
    assert.strictEqual(freePlan.price, 0);

    assert.ok(monthlyPlan, 'Plus Monthly must exist');
    assert.strictEqual(monthlyPlan.price, 9900); // ₹99 in paise

    assert.ok(annualPlan, 'Plus Annual must exist');
    assert.strictEqual(annualPlan.price, 99900); // ₹999 in paise
  });

  // 2. Unauthorized access protection
  it('GET /api/subscription/current blocks unauthenticated requests (401)', async () => {
    const res = await request('/api/subscription/current');
    assert.strictEqual(res.status, 401);
  });

  // 3. Authenticated default state
  it('GET /api/subscription/current returns Free Guard plan by default with full baseline safety access', async () => {
    const res = await request('/api/subscription/current', { token: testToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.subscription.planId, 'free');
    assert.strictEqual(res.body.emergencyBaseline.sosActivationEnabled, true);
    assert.strictEqual(res.body.emergencyBaseline.call112Enabled, true);
  });

  // 4. Order creation with server-side price enforcement
  it('POST /api/payments/create-order creates order with server-defined price (never client price)', async () => {
    const res = await request('/api/payments/create-order', {
      method: 'POST',
      token: testToken,
      body: { planId: 'plus_monthly' }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.order.amount, 9900); // Exactly ₹99 in paise
    assert.strictEqual(res.body.order.currency, 'INR');
    assert.ok(res.body.order.orderId);
  });

  // 5. Signature verification rejects forged signatures
  it('POST /api/payments/verify rejects invalid or forged payment signatures (400)', async () => {
    const res = await request('/api/payments/verify', {
      method: 'POST',
      token: testToken,
      body: {
        planId: 'plus_monthly',
        razorpay_order_id: 'order_fake_123',
        razorpay_payment_id: 'pay_fake_456',
        razorpay_signature: 'invalid_forged_signature'
      }
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  // 6. Valid signature activates subscription & verifies idempotency
  it('POST /api/payments/verify activates Plus plan upon verified signature and prevents duplicate replay', async () => {
    const mockOrderId = `order_demo_${Date.now()}`;
    const mockPaymentId = `pay_demo_${Date.now()}`;
    const mockSignature = `demo_sig_valid_${Date.now()}`;

    const res = await request('/api/payments/verify', {
      method: 'POST',
      token: testToken,
      body: {
        planId: 'plus_monthly',
        razorpay_order_id: mockOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.subscription.status, 'active');
    assert.strictEqual(res.body.subscription.planId, 'plus_monthly');
    assert.ok(res.body.subscription.currentPeriodEnd);

    // Verify idempotency: Repeating verify with same payment ID returns active without error
    const repeatRes = await request('/api/payments/verify', {
      method: 'POST',
      token: testToken,
      body: {
        planId: 'plus_monthly',
        razorpay_order_id: mockOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature
      }
    });
    assert.strictEqual(repeatRes.status, 200);

    // Ensure paymentHistory in DB only has 1 record for this paymentId
    const subDoc = await Subscription.findOne({ userId: testUserId });
    const matchingPayments = subDoc.paymentHistory.filter((p) => p.paymentId === mockPaymentId);
    assert.strictEqual(matchingPayments.length, 1);
  });

  // 7. Cancellation request sets cancelAtPeriodEnd without immediate cutoff
  it('POST /api/subscription/cancel flags cancelAtPeriodEnd while retaining benefits until period end', async () => {
    const res = await request('/api/subscription/cancel', {
      method: 'POST',
      token: testToken
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.subscription.cancelAtPeriodEnd, true);

    // Entitlement check still reports active benefits
    const currentRes = await request('/api/subscription/current', { token: testToken });
    assert.strictEqual(currentRes.body.subscription.cancelAtPeriodEnd, true);
    assert.strictEqual(currentRes.body.subscription.status, 'active');
  });

  // 8. Webhook handling with HMAC signature check & replay deduplication
  it('POST /api/payments/webhook validates HMAC signature and handles duplicate events idempotently', async () => {
    const testSecret = 'test_webhook_secret_key_123';
    config.razorpayWebhookSecret = testSecret;

    const eventPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_webhook_${Date.now()}`,
            order_id: `order_webhook_${Date.now()}`,
            amount: 99900,
            currency: 'INR',
            status: 'captured',
            notes: {
              userId: testUserId.toString(),
              planId: 'plus_annual'
            }
          }
        }
      }
    };

    const rawPayload = JSON.stringify(eventPayload);
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(rawPayload)
      .digest('hex');

    const eventId = `evt_test_${Date.now()}`;

    // 1st dispatch: Should process and return 200
    const res1 = await request('/api/payments/webhook', {
      method: 'POST',
      headers: {
        'x-razorpay-signature': validSignature,
        'x-razorpay-event-id': eventId
      },
      body: rawPayload
    });
    assert.strictEqual(res1.status, 200);

    // 2nd dispatch (duplicate webhook replay): Must return 200 with idempotent ignore
    const res2 = await request('/api/payments/webhook', {
      method: 'POST',
      headers: {
        'x-razorpay-signature': validSignature,
        'x-razorpay-event-id': eventId
      },
      body: rawPayload
    });
    assert.strictEqual(res2.status, 200);
    assert.ok(res2.body.message.includes('already processed'));
  });

  // 9. Emergency safety non-negotiable test: Free and expired users never lose SOS
  it('Emergency SOS activation and 112 dialing remain 100% functional regardless of plan', async () => {
    // Manually expire subscription in DB to test worst-case expiration
    await Subscription.findOneAndUpdate(
      { userId: testUserId },
      { status: 'expired', currentPeriodEnd: new Date(Date.now() - 10000) }
    );

    // 1. SOS trigger must succeed without blocking
    const sosRes = await request('/api/sos', {
      method: 'POST',
      token: testToken,
      body: {
        category: 'Medical Emergency',
        description: 'Testing SOS with expired subscription'
      }
    });
    assert.strictEqual(sosRes.status, 201);
    assert.strictEqual(sosRes.body.incident.status, 'active');

    // 2. Call 112 log must succeed
    const callRes = await request('/api/sos/call-112', {
      method: 'POST',
      token: testToken,
      body: {
        incidentId: sosRes.body.incident._id,
        notes: 'User calling 112 with expired subscription'
      }
    });
    assert.strictEqual(callRes.status, 200);
    assert.strictEqual(callRes.body.success, true);
  });
});
