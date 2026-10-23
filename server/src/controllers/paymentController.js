import { z } from 'zod';
import { paymentService } from '../services/paymentService.js';
import { subscriptionService } from '../services/subscriptionService.js';
import { getPlanById } from '../config/plans.js';

export const createOrderSchema = z.object({
  body: z.object({
    planId: z.enum(['plus_monthly', 'plus_annual'], {
      errorMap: () => ({ message: 'Plan must be either plus_monthly or plus_annual.' })
    })
  })
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    planId: z.enum(['plus_monthly', 'plus_annual']),
    razorpay_order_id: z.string().min(1, 'Order ID is required'),
    razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
    razorpay_signature: z.string().min(1, 'Signature is required')
  })
});

/**
 * Create Razorpay Order
 */
export const createOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const orderData = await paymentService.createOrder({
      userId: req.user._id,
      planId,
      userEmail: req.user.email,
      userName: req.user.name
    });

    res.status(201).json({
      success: true,
      message: 'Payment order created.',
      order: orderData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Cryptographically verify payment signature & activate subscription
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1. Verify HMAC-SHA256 signature
    const verification = paymentService.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.error || 'Payment signature verification failed. Untrusted transaction.'
      });
    }

    const plan = getPlanById(planId);

    // 2. Grant entitlements & record payment idempotently
    const subscription = await subscriptionService.activateSubscription({
      userId: req.user._id,
      planId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: plan.price,
      currency: 'INR',
      method: 'razorpay'
    });

    res.json({
      success: true,
      message: `Payment verified. ${plan.name} is now active.`,
      subscription: {
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle incoming Razorpay Webhook with raw signature check & replay deduplication
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const eventId = req.headers['x-razorpay-event-id'] || req.body?.event_id || req.body?.payload?.payment?.entity?.id;
    const eventType = req.body?.event;

    if (!signature || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'Missing x-razorpay-signature header or event type in webhook request.'
      });
    }

    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);

    const result = await paymentService.processWebhookEvent({
      eventId: eventId || `evt_${Date.now()}`,
      eventType,
      payload: req.body?.payload,
      rawBody,
      signature
    });

    res.status(result.status || 200).json({
      success: result.status === 200,
      message: result.message
    });
  } catch (err) {
    console.error('[Razorpay Webhook Error]', err);
    res.status(500).json({
      success: false,
      message: `Webhook handler error: ${err.message}`
    });
  }
};
