import { SUBSCRIPTION_PLANS, getPlanById } from '../config/plans.js';
import { subscriptionService } from '../services/subscriptionService.js';

/**
 * Get all available subscription plans and entitlements
 */
export const getPlans = (req, res) => {
  res.json({
    success: true,
    plans: Object.values(SUBSCRIPTION_PLANS),
    notice: 'Core emergency SOS and manual 112 calling are 100% free and never restricted.'
  });
};

/**
 * Get authenticated user's active plan, status, and entitlements
 */
export const getCurrentSubscription = async (req, res, next) => {
  try {
    const entitlements = await subscriptionService.getUserEntitlements(req.user._id);
    const subscription = await subscriptionService.getUserSubscription(req.user._id);

    res.json({
      success: true,
      subscription: {
        planId: subscription.planId,
        status: subscription.status,
        billingProvider: subscription.billingProvider,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        paymentHistory: subscription.paymentHistory
      },
      entitlements: entitlements.entitlements,
      emergencyBaseline: entitlements.emergencyBaseline
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Request cancellation of active paid subscription at end of billing cycle
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.cancelSubscription(req.user._id);
    res.json({
      success: true,
      message: 'Subscription will cancel at the end of current billing period. Active benefits retained until then.',
      subscription: {
        status: sub.status,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        currentPeriodEnd: sub.currentPeriodEnd
      }
    });
  } catch (err) {
    next(err);
  }
};
