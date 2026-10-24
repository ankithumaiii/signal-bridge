import { WhatsAppProviderInterface } from './whatsappProviderInterface.js';

/**
 * Meta WhatsApp Business Cloud API Provider Adapter
 * Directly connects to the official Meta WhatsApp Cloud API (Graph API)
 * without deprecated or unpublished third-party dependencies.
 *
 * Official Reference: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
export class MetaWhatsAppProvider extends WhatsAppProviderInterface {
  constructor({
    accessToken = '',
    phoneNumberId = '',
    apiVersion = 'v22.0',
    templateName = '',
    templateLanguage = 'en_US',
    timeoutMs = 10000
  } = {}) {
    super();
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.apiVersion = apiVersion || 'v22.0';
    this.templateName = templateName;
    this.templateLanguage = templateLanguage || 'en_US';
    this.timeoutMs = timeoutMs;
  }

  /**
   * Normalize destination phone number to WhatsApp Cloud API format:
   * E.164 country code + national number without '+' or leading zeros or punctuation.
   * e.g. +91 98765 43210 -> 919876543210
   */
  normalizePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return '';
    const digits = phone.replace(/[^\d]/g, '');

    // Standard 10-digit Indian mobile number -> prefix with India country code 91
    if (digits.length === 10) {
      return `91${digits}`;
    }
    // 11 digits starting with 0 -> replace leading 0 with 91
    if (digits.length === 11 && digits.startsWith('0')) {
      return `91${digits.slice(1)}`;
    }
    // Already has country code (e.g. 919876543210 or 14155552671)
    return digits;
  }

  /**
   * Build Meta Cloud API request payload
   */
  buildPayload({ to, message, templateName, templateLanguage, templateComponents }) {
    const cleanedTo = this.normalizePhoneNumber(to);
    const chosenTemplate = templateName !== undefined ? templateName : this.templateName;
    const chosenLanguage = templateLanguage || this.templateLanguage || 'en_US';

    // If template messaging is specified, use type: "template"
    if (chosenTemplate && chosenTemplate.trim().length > 0) {
      const templateObj = {
        name: chosenTemplate.trim(),
        language: {
          code: chosenLanguage
        }
      };

      // hello_world template does not take components/parameters
      if (chosenTemplate !== 'hello_world' && Array.isArray(templateComponents) && templateComponents.length > 0) {
        templateObj.components = templateComponents;
      }

      return {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanedTo,
        type: 'template',
        template: templateObj
      };
    }

    // Default to freeform text message (for customer care window or direct test alerts)
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanedTo,
      type: 'text',
      text: {
        preview_url: false,
        body: message || '[SIGNAL BRIDGE EMERGENCY ALERT] Assistance requested.'
      }
    };
  }

  /**
   * Send WhatsApp message via Meta Cloud API
   *
   * @param {Object} params
   * @param {string} params.to - Recipient phone number
   * @param {string} [params.message] - Message body for text message
   * @param {string} [params.templateName] - Template name if using approved Meta template
   * @param {string} [params.templateLanguage] - Template language code
   * @param {Array} [params.templateComponents] - Template variable components
   * @returns {Promise<{ success: boolean, providerMessageId: string|null, status: string, error: string|null, rawResponse: any }>}
   */
  async sendMessage({ to, message, templateName, templateLanguage, templateComponents }) {
    // 1. Validate required Meta API configuration
    if (!this.accessToken || !this.phoneNumberId) {
      return {
        success: false,
        providerMessageId: null,
        status: 'failed',
        error: 'Meta WhatsApp credentials missing: WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required in server environment.',
        rawResponse: null
      };
    }

    const cleanedTo = this.normalizePhoneNumber(to);
    if (!cleanedTo || cleanedTo.length < 10) {
      return {
        success: false,
        providerMessageId: null,
        status: 'failed',
        error: `Invalid destination phone number for WhatsApp: '${to}'. Must contain at least 10 digits.`,
        rawResponse: null
      };
    }

    const endpoint = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const payload = this.buildPayload({ to: cleanedTo, message, templateName, templateLanguage, templateComponents });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.messages && data.messages.length > 0) {
        const msgId = data.messages[0].id;
        return {
          success: true,
          providerMessageId: msgId,
          // Note: Meta accepts the message for delivery; actual handset delivery is asynchronous.
          // We mark status honestly as 'accepted_by_provider', not false 'delivered'.
          status: 'accepted_by_provider',
          error: null,
          rawResponse: {
            messagingProduct: data.messaging_product,
            contacts: data.contacts,
            messageId: msgId
          }
        };
      }

      // Handle Meta Graph API error response safely without leaking credentials
      let errorMessage = 'Meta WhatsApp Cloud API rejected message dispatch';
      if (data.error) {
        const details = data.error.error_data?.details || data.error.message || '';
        const code = data.error.code ? ` (Code: ${data.error.code})` : '';
        errorMessage = `Meta API Error${code}: ${details}`;
      } else if (response.statusText) {
        errorMessage = `Meta API HTTP ${response.status}: ${response.statusText}`;
      }

      return {
        success: false,
        providerMessageId: null,
        status: 'failed',
        error: errorMessage,
        rawResponse: {
          status: response.status,
          code: data.error?.code,
          subcode: data.error?.error_subcode,
          type: data.error?.type
        }
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
      return {
        success: false,
        providerMessageId: null,
        status: 'failed',
        error: isTimeout
          ? `Meta WhatsApp API connection timed out after ${this.timeoutMs}ms.`
          : `Network exception while communicating with Meta WhatsApp API: ${err.message}`,
        rawResponse: null
      };
    }
  }

  /**
   * Check delivery status with Meta Cloud API if needed
   */
  async checkDeliveryStatus(providerMessageId) {
    return {
      status: 'accepted_by_provider',
      deliveredAt: null,
      error: 'Delivery receipts are delivered via Meta webhooks.'
    };
  }
}
