import { SMSProviderInterface } from './smsProviderInterface.js';

/**
 * MSG91 SMS Provider Adapter for India
 * Adheres to TRAI DLT regulations and supports MSG91 Flow and SendSMS APIs.
 */
export class MSG91Provider extends SMSProviderInterface {
  /**
   * @param {Object} options
   * @param {string} options.authKey - MSG91 Auth Key
   * @param {string} [options.senderId] - Approved 6-character sender ID / Header
   * @param {string} [options.templateId] - Approved DLT Template ID
   * @param {string} [options.flowUrl] - Custom endpoint override if testing
   */
  constructor(options = {}) {
    super();
    this.authKey = options.authKey || '';
    this.senderId = options.senderId || 'SIGBRG';
    this.templateId = options.templateId || '';
    this.flowUrl = options.flowUrl || 'https://control.msg91.com/api/v5/flow/';
    this.sendUrl = 'https://api.msg91.com/api/v2/sendsms';
  }

  /**
   * Format phone number to clean 10 or 12 digit format required by Indian gateways
   */
  formatIndianPhone(phone) {
    if (!phone) return '';
    const cleaned = String(phone).replace(/[^\d]/g, '');
    if (cleaned.length === 10) return `91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned;
    return cleaned;
  }

  /**
   * Send SMS via MSG91
   */
  async sendSMS({ to, message, templateId, incidentNumber, location, name }) {
    if (!this.authKey) {
      return {
        success: false,
        providerMessageId: null,
        error: 'MSG91_AUTH_KEY is not configured in server environment.',
        rawResponse: null
      };
    }

    const formattedPhone = this.formatIndianPhone(to);
    if (!formattedPhone || formattedPhone.length < 10) {
      return {
        success: false,
        providerMessageId: null,
        error: `Invalid destination phone number format: '${to}'. Must be a valid mobile number.`,
        rawResponse: null
      };
    }

    const activeTemplate = templateId || this.templateId;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      // If DLT template is configured, use MSG91 Flow API
      if (activeTemplate) {
        const payload = {
          template_id: activeTemplate,
          sender: this.senderId,
          short_url: '0',
          recipients: [
            {
              mobiles: formattedPhone,
              name: name || 'Emergency Contact',
              incident: incidentNumber || 'SOS Alert',
              location: location?.address || (location?.lat ? `${location.lat}, ${location.lng}` : 'GPS unavailable'),
              map: location?.mapUrl || 'N/A'
            }
          ]
        };

        const res = await fetch(this.flowUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authkey: this.authKey
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || (data.type && data.type === 'error')) {
          return {
            success: false,
            providerMessageId: null,
            error: data.message || `MSG91 Flow API returned HTTP ${res.status}`,
            rawResponse: data
          };
        }

        const messageId = data.message || data.request_id || `msg91_${Date.now()}`;
        return {
          success: true,
          providerMessageId: String(messageId),
          error: null,
          rawResponse: data
        };
      } else {
        // Fallback to standard transactional payload
        const payload = {
          sender: this.senderId,
          route: '4',
          country: '91',
          sms: [
            {
              message: message,
              to: [formattedPhone]
            }
          ]
        };

        const res = await fetch(this.sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authkey: this.authKey
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.type === 'error') {
          return {
            success: false,
            providerMessageId: null,
            error: data.message || `MSG91 Send API returned HTTP ${res.status}`,
            rawResponse: data
          };
        }

        const messageId = data.message || data.request_id || `msg91_${Date.now()}`;
        return {
          success: true,
          providerMessageId: String(messageId),
          error: null,
          rawResponse: data
        };
      }
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      return {
        success: false,
        providerMessageId: null,
        error: isTimeout ? 'MSG91 gateway connection timed out after 8s.' : err.message,
        rawResponse: null
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Query delivery log from MSG91
   */
  async checkDeliveryStatus(providerMessageId) {
    if (!this.authKey || !providerMessageId) {
      return { status: 'unknown', deliveredAt: null, error: 'Missing authKey or messageId' };
    }

    try {
      const url = `https://api.msg91.com/api/v5/report?request_id=${encodeURIComponent(providerMessageId)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { authkey: this.authKey }
      });
      const data = await res.json().catch(() => ({}));

      if (data && data.status === 'DELIVERED') {
        return { status: 'delivered', deliveredAt: new Date(), error: null };
      }
      return { status: data?.status || 'accepted_by_provider', deliveredAt: null, error: null };
    } catch (err) {
      return { status: 'accepted_by_provider', deliveredAt: null, error: err.message };
    }
  }
}
