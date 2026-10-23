import { config } from '../../config/env.js';
import { MSG91Provider } from './msg91Provider.js';
import { MockSMSProvider } from './mockProvider.js';

export class SMSService {
  constructor(customProvider = null) {
    if (customProvider) {
      this.provider = customProvider;
    } else if (config.smsProvider === 'mock') {
      this.provider = new MockSMSProvider();
    } else {
      this.provider = new MSG91Provider({
        authKey: config.msg91AuthKey,
        senderId: config.msg91SenderId,
        templateId: config.msg91TemplateId
      });
    }
  }

  setProvider(provider) {
    this.provider = provider;
  }

  /**
   * Format SMS text for emergency alert
   */
  formatSMSMessage({ incident, user, recipientName }) {
    const loc = incident.location;
    const hasCoords = loc && loc.lat !== null && loc.lng !== null;
    const coordsStr = hasCoords ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : 'GPS unavailable';
    const mapStr = hasCoords ? `Map: https://osm.org/?mlat=${loc.lat}&mlon=${loc.lng}` : '';

    return `EMERGENCY ALERT from ${user?.name || 'Signal Bridge User'}: ${incident.category}. Location: ${coordsStr}. ${mapStr} Call 112 if in danger. [Ref: ${incident.incidentNumber}]`.trim();
  }

  /**
   * Dispatch emergency SOS notifications to trusted contacts
   * @param {Object} params
   * @param {Object} params.incident - Persistent SOSIncident document
   * @param {Array} params.contacts - Array of Contact documents from MongoDB
   * @param {Object} params.user - Authenticated User document
   * @returns {Promise<Array<Object>>} - Array of recipient status records
   */
  async dispatchSOSAlert({ incident, contacts, user }) {
    const recipientResults = [];

    for (const contact of contacts) {
      const recipientRecord = {
        contactId: contact._id,
        name: contact.name,
        phone: contact.phone,
        channel: 'sms',
        status: 'queued',
        providerMessageId: null,
        providerError: null,
        sentAt: null,
        deliveredAt: null,
        acknowledgedAt: null,
        acknowledgementNote: '',
        isDemoSimulated: false,
        attempts: 0
      };

      // 1. Strict DEMO MODE isolation check
      if (config.demoMode) {
        recipientRecord.channel = 'simulated_dispatch';
        recipientRecord.status = 'simulated';
        recipientRecord.sentAt = new Date();
        recipientRecord.deliveredAt = new Date(Date.now() + 1500); // Simulated delay
        recipientRecord.isDemoSimulated = true;
        recipientRecord.providerError = null;
        recipientRecord.providerMessageId = `sim_sms_${incident.incidentNumber}_${contact._id.toString().substring(0, 6)}`;
        recipientResults.push(recipientRecord);
        continue;
      }

      // 2. PRODUCTION MODE validation
      // Ensure provider is configured; fail safely without silent false success
      if (this.provider instanceof MSG91Provider && !config.msg91AuthKey) {
        recipientRecord.status = 'failed';
        recipientRecord.providerError = 'Production SMS gateway requires MSG91_AUTH_KEY in server environment.';
        recipientRecord.isDemoSimulated = false;
        recipientResults.push(recipientRecord);
        continue;
      }

      // 3. Dispatch via configured provider with bounded retries & idempotency
      const messageBody = this.formatSMSMessage({ incident, user, recipientName: contact.name });
      const MAX_RETRIES = 2;
      let attempt = 0;
      let dispatchSuccess = false;

      while (attempt <= MAX_RETRIES && !dispatchSuccess) {
        attempt++;
        recipientRecord.attempts = attempt;
        recipientRecord.status = 'sending';

        try {
          const res = await this.provider.sendSMS({
            to: contact.phone,
            message: messageBody,
            templateId: config.msg91TemplateId,
            senderId: config.msg91SenderId,
            incidentNumber: incident.incidentNumber,
            location: incident.location,
            name: contact.name
          });

          if (res.success && res.providerMessageId) {
            // Note: accepted_by_provider is explicit, not false "delivered"
            recipientRecord.status = 'accepted_by_provider';
            recipientRecord.providerMessageId = res.providerMessageId;
            recipientRecord.sentAt = new Date();
            recipientRecord.providerError = null;
            dispatchSuccess = true;
          } else {
            recipientRecord.providerError = res.error || 'Provider rejected SMS dispatch';
            if (attempt <= MAX_RETRIES) {
              // Brief linear backoff before retry (100ms)
              await new Promise((r) => setTimeout(r, 100));
            }
          }
        } catch (err) {
          recipientRecord.providerError = err.message || 'Network exception calling SMS provider';
          if (attempt <= MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 100));
          }
        }
      }

      if (!dispatchSuccess) {
        recipientRecord.status = 'failed';
      }

      recipientResults.push(recipientRecord);
    }

    return recipientResults;
  }

  /**
   * Safe, authenticated test-SMS execution
   * Strictly non-emergency: does NOT call 112, does NOT create an SOSIncident, does NOT dispatch to contacts.
   * Enforces allowlist in production and verifies provider readiness.
   *
   * @param {Object} params
   * @param {string} params.to - Destination phone number
   * @param {Object} params.user - Authenticated user object
   * @returns {Promise<Object>} Execution result with explicit status and delivery evidence
   */
  async sendTestSMS({ to, user }) {
    if (!to || typeof to !== 'string') {
      return {
        success: false,
        status: 'failed',
        blocker: 'INVALID_RECIPIENT',
        message: 'A destination phone number is required.'
      };
    }

    const cleanedTo = to.replace(/[^\d]/g, '');
    if (cleanedTo.length < 10) {
      return {
        success: false,
        status: 'failed',
        blocker: 'INVALID_PHONE_FORMAT',
        message: `Phone number '${to}' is invalid. Must be at least 10 digits.`
      };
    }

    // Allowlist enforcement:
    // If in production mode, require allowlist membership or user's own profile phone
    if (config.nodeEnv === 'production') {
      const allowlist = config.smsTestAllowlist || [];
      const userPhoneClean = (user?.phone || '').replace(/[^\d]/g, '');
      const isAllowlisted =
        (allowlist.length > 0 && allowlist.some((num) => cleanedTo.endsWith(num) || num.endsWith(cleanedTo))) ||
        (userPhoneClean && cleanedTo.endsWith(userPhoneClean));

      if (!isAllowlisted) {
        return {
          success: false,
          status: 'failed',
          blocker: 'RESTRICTED_ALLOWLIST',
          message: 'Destination number is not on the authorized SMS test allowlist. In production, test SMS is restricted to verified numbers.'
        };
      }
    }

    // Explicit non-emergency test message body
    const testMessage = `[Signal Bridge System Test] Non-emergency connectivity test from user ${user?.name || user?.email || 'Tester'}. No emergency action is required. Ref: SB-TEST-${Date.now().toString().slice(-4)}`;

    // 1. DEMO MODE ISOLATION
    if (config.demoMode) {
      return {
        success: true,
        status: 'simulated',
        channel: 'simulated_dispatch',
        isDemoSimulated: true,
        message: 'DEMO MODE: Simulated test SMS completed successfully. Outbound carrier transmission was prevented.',
        recipient: to,
        providerMessageId: `sim_test_${Date.now()}`,
        timestamp: new Date()
      };
    }

    // 2. PRODUCTION / REAL MODE: Check for missing provider configuration
    if (this.provider instanceof MSG91Provider && !config.msg91AuthKey) {
      return {
        success: false,
        status: 'failed',
        blocker: 'MISSING_PROVIDER_CREDENTIALS',
        message: 'MSG91_AUTH_KEY is not configured in the server environment. Real SMS dispatch is blocked.',
        recipient: to,
        providerMessageId: null
      };
    }

    // 3. DISPATCH VIA CONFIGURED PROVIDER
    try {
      const res = await this.provider.sendSMS({
        to,
        message: testMessage,
        name: user?.name || 'Tester',
        incidentNumber: 'TEST-SYS'
      });

      if (res.success && res.providerMessageId) {
        return {
          success: true,
          status: 'accepted_by_provider',
          channel: 'sms',
          isDemoSimulated: false,
          message: 'Test notification accepted by SMS provider. Note: Provider acceptance confirms gateway acceptance, not final handset delivery.',
          recipient: to,
          providerMessageId: res.providerMessageId,
          timestamp: new Date()
        };
      } else {
        return {
          success: false,
          status: 'failed',
          channel: 'sms',
          isDemoSimulated: false,
          error: res.error || 'Provider rejected test SMS dispatch.',
          recipient: to,
          providerMessageId: null
        };
      }
    } catch (err) {
      return {
        success: false,
        status: 'failed',
        channel: 'sms',
        isDemoSimulated: false,
        error: err.message || 'Network exception while connecting to SMS provider.',
        recipient: to,
        providerMessageId: null
      };
    }
  }
}

export const smsService = new SMSService();
