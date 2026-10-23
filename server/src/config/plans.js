/**
 * Centralized Subscription Plans & Entitlements Definition
 * Prices in INR paise (1 INR = 100 paise)
 */
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Signal Bridge Core',
    badge: 'Standard Emergency Protection',
    price: 0,
    currency: 'INR',
    displayPrice: '₹0',
    interval: 'forever',
    billingPeriod: 'Free forever',
    description: 'Essential emergency safety, zero-cost emergency circle, and direct ERSS 112 dialer access.',
    features: [
      'Immediate Emergency SOS activation with haptic trigger',
      'Instant access to India ERSS 112 emergency calling',
      'Up to 3 trusted emergency contacts with SMS telemetry',
      'Live Geospatial Hazard Map & active neighborhood warnings',
      'One-tap "I\'m Safe" and "Need Help" quick pings',
      'Store-and-forward offline outbox with automatic sync'
    ],
    entitlements: {
      maxContacts: 3,
      extendedHistoryDays: 7,
      prioritySMSDispatch: false,
      scheduledSafetyCheckIns: false,
      exportMedicalPass: false,
      familyCoverageSlots: 1
    }
  },
  plus_monthly: {
    id: 'plus_monthly',
    name: 'Signal Bridge Plus (Monthly)',
    badge: 'Enhanced Family Safety',
    price: 9900, // ₹99.00 in paise
    currency: 'INR',
    displayPrice: '₹99',
    interval: 'month',
    billingPeriod: 'Billed monthly',
    description: 'Expanded emergency responder circle, extended incident audit ledger, and automated check-ins.',
    features: [
      'All Core Free features included',
      'Expanded Emergency Circle (up to 20 trusted responders)',
      '90-day immutable incident audit ledger with telemetry maps',
      'Priority carrier SMS gateway routing with delivery confirmation',
      'Automated scheduled family check-in reminders',
      'Emergency Medical Pass PDF with allergies and telemetry'
    ],
    entitlements: {
      maxContacts: 20,
      extendedHistoryDays: 90,
      prioritySMSDispatch: true,
      scheduledSafetyCheckIns: true,
      exportMedicalPass: true,
      familyCoverageSlots: 1
    }
  },
  plus_annual: {
    id: 'plus_annual',
    name: 'Signal Bridge Plus (Annual)',
    badge: 'Best Value • Family Circle',
    price: 99900, // ₹999.00 in paise (~16% discount)
    currency: 'INR',
    displayPrice: '₹999',
    interval: 'year',
    billingPeriod: 'Billed annually (~₹83/mo)',
    savings: 'Save ₹189 yearly',
    description: 'Complete family safety coverage, full 365-day history audit ledger, and multi-member coverage.',
    features: [
      'All Plus Monthly features included',
      'Up to 50 trusted emergency contacts and neighborhood responders',
      'Full 365-day emergency history ledger and report export',
      'Family Circle Coverage (link up to 5 family accounts)',
      'Direct priority telemetry corroboration with official alerts'
    ],
    entitlements: {
      maxContacts: 50,
      extendedHistoryDays: 365,
      prioritySMSDispatch: true,
      scheduledSafetyCheckIns: true,
      exportMedicalPass: true,
      familyCoverageSlots: 5
    }
  }
};

/**
 * Get plan by ID with safe fallback to free
 */
export const getPlanById = (planId) => {
  return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
};
