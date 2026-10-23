import crypto from 'crypto';
import Razorpay from 'razorpay';
import { config } from '../config/env.js';
import { SUBSCRIPTION_PLANS, getPlanById } from '../config/plans.js';
import { subscriptionService } from './subscriptionService.js';
import { ProcessedWebhook } from '../models/ProcessedWebhook.js';

export class PaymentService {
  constructor() {
    this.razorpay = null;
    this.isConfigured = Boolean(config.razorpayKeyId && config.razorpayKeySecret);

    if (this.isConfigured) {
      try {
        this.razorpay = new Razorpay({
          key_id: config.razorpayKeyId,
          key_secret: config.razorpayKeySecret
        });
      } catch (e) {
        console.warn('[PaymentService] Razorpay initialization failed:', e.message);
      }
    }
  }

  /**
   * Helper to inspect if production Razorpay credentials are ready
   */
  hasValidCredentials() {
    return Boolean(config.razorpayKeyId && config.razorpayKeySecret);
  }

  /**
   * Create Razorpay Payment Order using server-defined price
   */
  async createOrder({ userId, planId, userEmail, userName }) {
    const plan = getPlanById(planId);
    if (!plan || plan.price <= 0) {
      throw new Error(`Invalid plan for payment order: '${planId}'`);
    }

    const receipt = `rcpt_${userId.toString().substring(0, 6)}_${Date.now()}`;

    // 1. Live/Test Razorpay SDK order creation when credentials exist
    if (this.hasValidCredentials() && this.razorpay) {
      const options = {
        amount: plan.price, // in paise
        currency: 'INR',
        receipt,
        notes: {
          userId: userId.toString(),
          planId: plan.id,
          userEmail: userEmail || '',
          platform: 'Signal Bridge Safety Platform'
        }
      };

      const order = await this.razorpay.orders.create(options);
      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: config.razorpayKeyId,
        plan: {
          id: plan.id,
          name: plan.name,
          displayPrice: plan.displayPrice,
          interval: plan.interval
        },
        mode: config.demoMode ? 'test_sandbox' : 'production'
      };
    }

    // 2. Safe Demo/Sandbox Mode order when merchant credentials have not been configured
    if (config.demoMode) {
      const mockOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        orderId: mockOrderId,
        amount: plan.price,
        currency: 'INR',
        keyId: config.razorpayKeyId || 'rzp_test_signal_bridge_demo',
        plan: {
          id: plan.id,
          name: plan.name,
          displayPrice: plan.displayPrice,
          interval: plan.interval
        },
        mode: 'test_sandbox',
        notice: 'DEMO SANDBOX: Real Razorpay merchant keys not configured. Safe simulation active.'
      };
    }

    // In production without credentials, fail strictly
    throw new Error('Production Razorpay credentials (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are missing.');
  }

  /**
   * Cryptographically verify payment signature returned by Razorpay Checkout
   */
  verifyPaymentSignature({ orderId, paymentId, signature }) {
    if (!orderId || !paymentId || !signature) {
      return { valid: false, error: 'Missing orderId, paymentId, or signature in payload.' };
    }

    // Sandbox check
    if (config.demoMode && orderId.startsWith('order_demo_')) {
      // In demo mode, accept test signature format
      if (signature.startsWith('demo_sig_') || signature.length >= 10) {
        return { valid: true, error: null };
      }
    }

    const secret = config.razorpayKeySecret;
    if (!secret) {
      return { valid: false, error: 'Server RAZORPAY_KEY_SECRET is not configured for signature verification.' };
    }

    try {
      const body = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      // Constant time comparison to prevent timing attacks
      const expectedBuffer = Buffer.from(expectedSignature);
      const receivedBuffer = Buffer.from(signature);

      if (expectedBuffer.length !== receivedBuffer.length) {
        return { valid: false, error: 'Signature length mismatch.' };
      }

      const isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
      return { valid: isValid, error: isValid ? null : 'Payment signature mismatch. Transaction untrusted.' };
    } catch (err) {
      return { valid: false, error: `Signature verification exception: ${err.message}` };
    }
  }

  /**
   * Verify Razorpay Webhook signature using raw request body
   */
  verifyWebhookSignature({ rawBody, signature }) {
    const webhookSecret = config.razorpayWebhookSecret;
    if (!webhookSecret) {
      return { valid: false, error: 'RAZORPAY_WEBHOOK_SECRET is not configured on server.' };
    }

    if (!rawBody || !signature) {
      return { valid: false, error: 'Missing rawBody or x-razorpay-signature header.' };
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature);
      const receivedBuffer = Buffer.from(signature);

      if (expectedBuffer.length !== receivedBuffer.length) {
        return { valid: false, error: 'Webhook signature length mismatch.' };
      }

      const isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
      return { valid: isValid, error: isValid ? null : 'Invalid webhook HMAC signature.' };
    } catch (err) {
      return { valid: false, error: `Webhook signature exception: ${err.message}` };
    }
  }

  /**
   * Process Razorpay Webhook with replay protection and idempotency
   */
  async processWebhookEvent({ eventId, eventType, payload, rawBody, signature }) {
    // 1. Verify signature
    const sigCheck = this.verifyWebhookSignature({ rawBody, signature });
    if (!sigCheck.valid) {
      return { status: 400, message: sigCheck.error };
    }

    // 2. Webhook Idempotency Check
    const existing = await ProcessedWebhook.findOne({ eventId });
    if (existing) {
      return { status: 200, message: 'Event already processed (idempotent ignore).' };
    }

    // 3. Record pending processing
    const webhookRecord = new ProcessedWebhook({
      eventId,
      event: eventType,
      provider: 'razorpay',
      status: 'processing',
      payloadSummary: {
        orderId: payload?.payment?.entity?.order_id || payload?.order?.entity?.id,
        paymentId: payload?.payment?.entity?.id,
        amount: payload?.payment?.entity?.amount
      }
    });
    await webhookRecord.save();

    // 4. Handle events
    try {
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        const payment = payload?.payment?.entity;
        const notes = payment?.notes || {};
        const userId = notes.userId;
        const planId = notes.planId;

        if (userId && planId) {
          await subscriptionService.activateSubscription({
            userId,
            planId,
            orderId: payment.order_id,
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency || 'INR',
            method: payment.method || 'upi_card'
          });
        }
      } else if (eventType === 'payment.failed') {
        console.warn('[Razorpay Webhook] Payment failed event received:', payload?.payment?.entity?.id);
      }

      webhookRecord.status = 'processed';
      await webhookRecord.save();

      return { status: 200, message: 'Webhook event processed successfully.' };
    } catch (err) {
      webhookRecord.status = 'failed';
      await webhookRecord.save();
      throw err;
    }
  }
}

export const paymentService = new PaymentService();
