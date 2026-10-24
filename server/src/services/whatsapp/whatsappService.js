import { config } from '../../config/env.js';
import { smsService } from '../sms/smsService.js';
import { MetaWhatsAppProvider } from './metaWhatsAppProvider.js';
import { MockWhatsAppProvider } from './mockWhatsAppProvider.js';

export class WhatsAppService {
  constructor(customProvider = null) {
    if (customProvider) {
      this.provider = customProvider;
    } else if (config.smsProvider === 'mock' || process.env.WHATSAPP_PROVIDER === 'mock') {
      this.provider = new MockWhatsAppProvider();
    } else {
      this.provider = new MetaWhatsAppProvider({
        accessToken: config.whatsappAccessToken,
        phoneNumberId: config.whatsappPhoneNumberId,
        apiVersion: config.whatsappApiVersion,
        templateName: config.whatsappTemplateName,
        templateLanguage: config.whatsappTemplateLanguage
      });
    }

    // In-memory deduplication cache: key -> timestamp (TTL 60 seconds)
    this.dedupCache = new Map();
  }

  setProvider(provider) {
    this.provider = provider;
  }

  /**
   * Deduplication check to prevent spamming contacts on rapid retries or double submits
   */
  isDuplicate(key) {
    const now = Date.now();
    const lastSent = this.dedupCache.get(key);
    if (lastSent && now - lastSent < 60000) {
      return true;
    }
    this.dedupCache.set(key, now);

    // Housekeeping: clean older entries periodically
    if (this.dedupCache.size > 200) {
      for (const [k, v] of this.dedupCache.entries()) {
        if (now - v > 60000) this.dedupCache.delete(k);
      }
    }
    return false;
  }

  /**
   * Format WhatsApp message body for emergency SOS alerts
   * Keeps notification focused, urgent, and clear, omitting unnecessary private or medical notes.
   */
  formatWhatsAppMessage({ incident, user, recipientName }) {
    const locInfo = smsService.formatLocation(incident?.location);
    const userName = user?.name || 'Signal Bridge Citizen';
    const category = incident?.category || 'Emergency Alert';
    const incidentRef = incident?.incidentNumber || 'SOS';
    const timestamp = new Date(incident?.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const rawDetails = incident?.description || incident?.message;
    const detailsPart = rawDetails && rawDetails !== 'Immediate assistance requested.' && rawDetails.trim().length > 0
      ? `\n*Note:* ${rawDetails.trim().substring(0, 120)}${rawDetails.length > 120 ? '…' : ''}`
      : '';

    const mapPart = locInfo.hasCoords
      ? `\n*Live Map:* ${locInfo.googleMapsUrl}`
      : '\n*Location:* GPS coordinates unavailable';

    return `🚨 *SIGNAL BRIDGE EMERGENCY ALERT* 🚨\n\n*From:* ${userName}\n*Category:* ${category}\n*Ref:* ${incidentRef} at ${timestamp}${detailsPart}${mapPart}\n\n⚠️ _Official Emergency (India): Call 112 if immediate rescue is required._`;
  }

  /**
   * Build approved template components for WhatsApp template messages
   * Parameter order:
   * 1: User name
   * 2: Category
   * 3: Incident Reference
   * 4: Location Map URL
   */
  formatTemplateComponents({ incident, user }) {
    const locInfo = smsService.formatLocation(incident?.location);
    const userName = user?.name || 'Signal Bridge Citizen';
    const category = incident?.category || 'Emergency';
    const incidentRef = incident?.incidentNumber || 'SOS';
    const mapUrl = locInfo.hasCoords ? locInfo.googleMapsUrl : 'Coordinates unavailable';

    return [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: userName },
          { type: 'text', text: category },
          { type: 'text', text: incidentRef },
          { type: 'text', text: mapUrl }
        ]
      }
    ];
  }

  /**
   * Dispatch emergency WhatsApp notifications to trusted contacts
   *
   * @param {Object} params
   * @param {Object} params.incident - SOSIncident document
   * @param {Array} params.contacts - Trusted Contact documents
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
        channel: 'whatsapp',
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

      // Input validation for destination phone
      if (!contact.phone || typeof contact.phone !== 'string' || contact.phone.trim().length < 6) {
        recipientRecord.status = 'failed';
        recipientRecord.providerError = 'Invalid or missing phone number for WhatsApp emergency contact.';
        recipientResults.push(recipientRecord);
        continue;
      }

      // Deduplication check
      const dedupKey = `wa_${incident.incidentNumber}_${contact.phone.replace(/[^\d]/g, '')}`;
      if (this.isDuplicate(dedupKey)) {
        recipientRecord.status = 'accepted_by_provider';
        recipientRecord.providerError = 'Notification already dispatched recently (deduplicated).';
        recipientRecord.sentAt = new Date();
        recipientResults.push(recipientRecord);
        continue;
      }

      // 1. Safe DEMO MODE or WHATSAPP_ENABLED=false check
      if (config.demoMode || !config.whatsappEnabled) {
        recipientRecord.channel = 'simulated_whatsapp';
        recipientRecord.status = 'simulated';
        recipientRecord.sentAt = new Date();
        recipientRecord.deliveredAt = new Date(Date.now() + 1200);
        recipientRecord.isDemoSimulated = true;
        recipientRecord.providerError = null;
        recipientRecord.providerMessageId = `sim_wa_${incident.incidentNumber}_${contact._id.toString().substring(0, 6)}`;
        recipientResults.push(recipientRecord);
        continue;
      }

      // 2. PRODUCTION MODE validation: missing credentials fail safely without false success
      if (this.provider instanceof MetaWhatsAppProvider && (!config.whatsappAccessToken || !config.whatsappPhoneNumberId)) {
        recipientRecord.status = 'failed';
        recipientRecord.providerError = 'Production WhatsApp gateway requires WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in server environment.';
        recipientRecord.isDemoSimulated = false;
        recipientResults.push(recipientRecord);
        continue;
      }

      // 3. Dispatch via configured provider with bounded retries
      const messageBody = this.formatWhatsAppMessage({ incident, user, recipientName: contact.name });
      const templateComponents = config.whatsappTemplateName
        ? this.formatTemplateComponents({ incident, user })
        : null;

      const MAX_RETRIES = 2;
      let attempt = 0;
      let dispatchSuccess = false;

      while (attempt <= MAX_RETRIES && !dispatchSuccess) {
        attempt++;
        recipientRecord.attempts = attempt;
        recipientRecord.status = 'sending';

        try {
          const res = await this.provider.sendMessage({
            to: contact.phone,
            message: messageBody,
            templateName: config.whatsappTemplateName || null,
            templateLanguage: config.whatsappTemplateLanguage || 'en_US',
            templateComponents,
            incidentNumber: incident.incidentNumber,
            location: incident.location
          });

          if (res.success && res.providerMessageId) {
            // Note: accepted_by_provider confirms gateway acceptance, not final handset delivery
            recipientRecord.status = 'accepted_by_provider';
            recipientRecord.providerMessageId = res.providerMessageId;
            recipientRecord.sentAt = new Date();
            recipientRecord.providerError = null;
            dispatchSuccess = true;
          } else {
            recipientRecord.providerError = res.error || 'Meta WhatsApp provider rejected dispatch';
            if (attempt <= MAX_RETRIES) {
              await new Promise((r) => setTimeout(r, 100));
            }
          }
        } catch (err) {
          recipientRecord.providerError = err.message || 'Network exception calling WhatsApp provider';
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
   * Safe, authenticated test-WhatsApp execution
   * Strictly non-emergency: does NOT call 112, does NOT create an SOSIncident, does NOT dispatch to contacts.
   * Enforces allowlist in production and verifies provider readiness.
   *
   * @param {Object} params
   * @param {string} params.to - Destination phone number
   * @param {Object} params.user - Authenticated user object
   * @returns {Promise<Object>} Execution result with explicit status and delivery evidence
   */
  async sendTestWhatsApp({ to, user }) {
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
    // In production, restrict to configured allowlist or user's verified profile phone
    if (config.nodeEnv === 'production') {
      const allowlist = config.whatsappTestAllowlist || config.smsTestAllowlist || [];
      const userPhoneClean = (user?.phone || '').replace(/[^\d]/g, '');
      const isAllowlisted =
        (allowlist.length > 0 && allowlist.some((num) => cleanedTo.endsWith(num) || num.endsWith(cleanedTo))) ||
        (userPhoneClean && (cleanedTo.endsWith(userPhoneClean) || userPhoneClean.endsWith(cleanedTo)));

      if (!isAllowlisted) {
        return {
          success: false,
          status: 'failed',
          blocker: 'RESTRICTED_ALLOWLIST',
          message: 'Destination number is not on the authorized WhatsApp test allowlist. In production, testing is restricted to verified numbers.'
        };
      }
    }

    // Explicit non-emergency test message body
    const testMessage = `[Signal Bridge System Test] Non-emergency WhatsApp connectivity test from user ${user?.name || user?.email || 'Tester'}. No emergency action is required. Ref: SB-WA-TEST-${Date.now().toString().slice(-4)}`;

    // 1. Safe DEMO MODE or WHATSAPP_ENABLED=false
    if (config.demoMode || !config.whatsappEnabled) {
      return {
        success: true,
        status: 'simulated',
        channel: 'simulated_whatsapp',
        isDemoSimulated: true,
        message: config.demoMode
          ? 'DEMO MODE: Simulated WhatsApp alert completed successfully. Outbound Meta WhatsApp transmission was prevented.'
          : 'WHATSAPP_ENABLED is false: Simulated WhatsApp alert completed. Set WHATSAPP_ENABLED=true and configure Meta credentials to enable live outbound messaging.',
        recipient: to,
        providerMessageId: `sim_wa_test_${Date.now()}`,
        timestamp: new Date()
      };
    }

    // 2. PRODUCTION / REAL MODE: Check for missing provider credentials
    if (this.provider instanceof MetaWhatsAppProvider && (!config.whatsappAccessToken || !config.whatsappPhoneNumberId)) {
      return {
        success: false,
        status: 'failed',
        blocker: 'MISSING_PROVIDER_CREDENTIALS',
        message: 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured in the server environment. Real WhatsApp dispatch is blocked.',
        recipient: to,
        providerMessageId: null
      };
    }

    // 3. DISPATCH VIA CONFIGURED PROVIDER
    try {
      // In Meta developer test mode, 'hello_world' is the default pre-approved template available on every account
      const chosenTemplate = config.whatsappTemplateName || 'hello_world';

      const res = await this.provider.sendMessage({
        to,
        message: testMessage,
        templateName: chosenTemplate,
        templateLanguage: config.whatsappTemplateLanguage || 'en_US',
        incidentNumber: 'TEST-SYS-WA'
      });

      if (res.success && res.providerMessageId) {
        return {
          success: true,
          status: 'accepted_by_provider',
          channel: 'whatsapp',
          isDemoSimulated: false,
          message: 'Test notification accepted by Meta WhatsApp Cloud API. Note: Provider acceptance confirms gateway acceptance, not final handset delivery.',
          recipient: to,
          providerMessageId: res.providerMessageId,
          timestamp: new Date()
        };
      } else {
        return {
          success: false,
          status: 'failed',
          channel: 'whatsapp',
          isDemoSimulated: false,
          error: res.error || 'Meta WhatsApp provider rejected test message dispatch.',
          recipient: to,
          providerMessageId: null
        };
      }
    } catch (err) {
      return {
        success: false,
        status: 'failed',
        channel: 'whatsapp',
        isDemoSimulated: false,
        error: err.message || 'Network exception while connecting to Meta WhatsApp provider.',
        recipient: to,
        providerMessageId: null
      };
    }
  }
}

export const whatsappService = new WhatsAppService();
