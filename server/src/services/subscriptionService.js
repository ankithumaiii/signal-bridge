import { Subscription } from '../models/Subscription.js';
import { SUBSCRIPTION_PLANS, getPlanById } from '../config/plans.js';

export class SubscriptionService {
  /**
   * Get or initialize subscription for user with auto-expiry check
   */
  async getUserSubscription(userId) {
    let sub = await Subscription.findOne({ userId });

    if (!sub) {
      sub = new Subscription({
        userId,
        planId: 'free',
        status: 'free',
        billingProvider: 'none',
        currentPeriodStart: new Date(),
        currentPeriodEnd: null
      });
      await sub.save();
      return sub;
    }

    // Check expiration on read
    if (sub.status === 'active' && sub.currentPeriodEnd) {
      const now = new Date();
      if (now > sub.currentPeriodEnd) {
        sub.status = 'expired';
        await sub.save();
      }
    }

    return sub;
  }

  /**
   * Evaluate user entitlements strictly on backend
   * Ensures emergency SOS is never restricted by plan status.
   */
  async getUserEntitlements(userId) {
    const sub = await this.getUserSubscription(userId);
    const isPlanActive = sub.status === 'active' && (!sub.currentPeriodEnd || new Date() <= sub.currentPeriodEnd);

    const activePlan = isPlanActive ? getPlanById(sub.planId) : SUBSCRIPTION_PLANS.free;

    return {
      planId: activePlan.id,
      planName: activePlan.name,
      status: sub.status,
      isActive: isPlanActive,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      entitlements: activePlan.entitlements,
      // Critical emergency safety baseline — 100% free for all users
      emergencyBaseline: {
        sosActivationEnabled: true,
        call112Enabled: true,
        communityHazardMapEnabled: true,
        offlineOutboxSyncEnabled: true
      }
    };
  }

  /**
   * Activate or renew subscription following verified payment evidence
   */
  async activateSubscription({
    userId,
    planId,
    orderId,
    paymentId,
    amount,
    currency = 'INR',
    method = 'razorpay'
  }) {
    const plan = getPlanById(planId);
    if (!plan || plan.id === 'free') {
      throw new Error(`Invalid plan for paid activation: ${planId}`);
    }

    let sub = await Subscription.findOne({ userId });
    if (!sub) {
      sub = new Subscription({ userId });
    }

    // Idempotency check: prevent duplicate grants for same paymentId
    const alreadyProcessed = sub.paymentHistory.some((p) => p.paymentId === paymentId);
    if (alreadyProcessed && sub.status === 'active' && sub.planId === planId) {
      return sub;
    }

    const now = new Date();
    // Calculate new period end
    const durationDays = plan.interval === 'year' ? 365 : 30;
    const periodStart = sub.status === 'active' && sub.currentPeriodEnd && sub.currentPeriodEnd > now
      ? sub.currentPeriodEnd
      : now;
    const periodEnd = new Date(periodStart.getTime() + durationDays * 24 * 60 * 60 * 1000);

    sub.planId = planId;
    sub.status = 'active';
    sub.billingProvider = 'razorpay';
    sub.providerOrderId = orderId;
    sub.providerPaymentId = paymentId;
    sub.currentPeriodStart = now;
    sub.currentPeriodEnd = periodEnd;
    sub.cancelAtPeriodEnd = false;

    if (!alreadyProcessed) {
      sub.paymentHistory.push({
        orderId,
        paymentId,
        amount,
        currency,
        status: 'captured',
        method,
        paidAt: now
      });
    }

    await sub.save();
    return sub;
  }

  /**
   * Request cancellation at end of current paid billing period
   */
  async cancelSubscription(userId) {
    const sub = await Subscription.findOne({ userId });
    if (!sub || sub.status !== 'active') {
      throw new Error('No active paid subscription found to cancel.');
    }

    sub.cancelAtPeriodEnd = true;
    await sub.save();
    return sub;
  }
}

export const subscriptionService = new SubscriptionService();
