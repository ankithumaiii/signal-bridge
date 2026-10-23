import { SMSProviderInterface } from './smsProviderInterface.js';

/**
 * Mock SMS Provider for automated unit/integration tests and local offline testing.
 * Records messages in memory and simulates realistic provider acceptance and delivery.
 */
export class MockSMSProvider extends SMSProviderInterface {
  constructor() {
    super();
    this.sentMessages = [];
    this.shouldFail = false;
    this.failureError = 'Simulated provider gateway error';
    this.simulatedTransitMs = 50;
  }

  setShouldFail(fail, error = 'Simulated provider gateway error') {
    this.shouldFail = fail;
    this.failureError = error;
  }

  clear() {
    this.sentMessages = [];
    this.shouldFail = false;
  }

  getSentMessages() {
    return [...this.sentMessages];
  }

  async sendSMS(params) {
    if (this.shouldFail) {
      return {
        success: false,
        providerMessageId: null,
        error: this.failureError,
        rawResponse: { error: this.failureError }
      };
    }

    const providerMessageId = `mock_sms_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const record = {
      ...params,
      providerMessageId,
      sentAt: new Date(),
      status: 'accepted_by_provider'
    };
    this.sentMessages.push(record);

    return {
      success: true,
      providerMessageId,
      error: null,
      rawResponse: { status: 'accepted', id: providerMessageId }
    };
  }

  async checkDeliveryStatus(providerMessageId) {
    const msg = this.sentMessages.find((m) => m.providerMessageId === providerMessageId);
    if (!msg) {
      return { status: 'unknown', deliveredAt: null, error: 'Message not found in mock store' };
    }
    return {
      status: 'delivered',
      deliveredAt: new Date(),
      error: null
    };
  }
}
