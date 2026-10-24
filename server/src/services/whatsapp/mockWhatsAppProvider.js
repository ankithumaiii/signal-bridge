import { WhatsAppProviderInterface } from './whatsappProviderInterface.js';

/**
 * Mock WhatsApp Provider Adapter
 * Simulates WhatsApp Cloud API behavior for automated tests, offline development,
 * and demo isolation without outbound network transmission.
 */
export class MockWhatsAppProvider extends WhatsAppProviderInterface {
  constructor() {
    super();
    this.sentMessages = [];
    this.shouldFail = false;
    this.failureReason = 'Mock provider simulated gateway failure';
    this.shouldTimeout = false;
  }

  setShouldFail(shouldFail, reason = 'Mock provider simulated failure') {
    this.shouldFail = shouldFail;
    this.failureReason = reason;
  }

  setShouldTimeout(shouldTimeout) {
    this.shouldTimeout = shouldTimeout;
  }

  clearHistory() {
    this.sentMessages = [];
  }

  async sendMessage({ to, message, templateName, templateLanguage, templateComponents, incidentNumber }) {
    if (this.shouldTimeout) {
      await new Promise((r) => setTimeout(r, 50));
      return {
        success: false,
        providerMessageId: null,
        status: 'failed',
        error: 'Meta WhatsApp API connection timed out after 10000ms.',
        rawResponse: null
      };
    }

    if (this.shouldFail) {
      return {
        success: false,
        providerMessageId: null,
        status: 'failed',
        error: this.failureReason,
        rawResponse: { error: { message: this.failureReason, code: 500 } }
      };
    }

    const digits = (to || '').replace(/[^\d]/g, '');
    const fakeId = `wamid.HBgL${digits.slice(-10)}Mock${Date.now().toString(36)}`;

    const record = {
      to,
      message,
      templateName,
      templateLanguage,
      templateComponents,
      incidentNumber,
      providerMessageId: fakeId,
      sentAt: new Date()
    };

    this.sentMessages.push(record);

    return {
      success: true,
      providerMessageId: fakeId,
      status: 'accepted_by_provider',
      error: null,
      rawResponse: {
        messaging_product: 'whatsapp',
        contacts: [{ input: to, wa_id: digits }],
        messages: [{ id: fakeId }]
      }
    };
  }

  async checkDeliveryStatus(providerMessageId) {
    return {
      status: 'delivered',
      deliveredAt: new Date(),
      error: null
    };
  }
}
