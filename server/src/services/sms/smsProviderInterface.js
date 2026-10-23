/**
 * Base SMS Provider Interface
 * All SMS provider adapters (MSG91, Mock, etc.) must implement this interface.
 */
export class SMSProviderInterface {
  /**
   * Send an SMS message
   * @param {Object} params
   * @param {string} params.to - Recipient phone number (E.164 or 10-digit Indian mobile)
   * @param {string} params.message - Text body
   * @param {string} [params.templateId] - Approved DLT template ID
   * @param {string} [params.senderId] - Approved sender ID / header
   * @param {string} [params.incidentNumber] - Incident reference
   * @param {Object} [params.location] - Incident location
   * @returns {Promise<{ success: boolean, providerMessageId: string|null, error: string|null, rawResponse: any }>}
   */
  async sendSMS(params) {
    throw new Error('sendSMS() must be implemented by provider adapter');
  }

  /**
   * Check delivery status with provider if supported
   * @param {string} providerMessageId
   * @returns {Promise<{ status: string, deliveredAt: Date|null, error: string|null }>}
   */
  async checkDeliveryStatus(providerMessageId) {
    throw new Error('checkDeliveryStatus() must be implemented by provider adapter');
  }
}
