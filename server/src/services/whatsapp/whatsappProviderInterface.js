/**
 * Base WhatsApp Provider Interface
 * All WhatsApp provider adapters (MetaWhatsAppProvider, MockWhatsAppProvider, etc.)
 * must implement this interface.
 */
export class WhatsAppProviderInterface {
  /**
   * Send a WhatsApp message
   * @param {Object} params
   * @param {string} params.to - Destination phone number (E.164 or cleaned digits)
   * @param {string} [params.message] - Freeform message body (if text message)
   * @param {string} [params.templateName] - Approved Meta WhatsApp template name
   * @param {string} [params.templateLanguage] - Template language code (e.g. 'en_US')
   * @param {Array} [params.templateComponents] - Array of template components / variables
   * @param {string} [params.incidentNumber] - Incident reference code
   * @param {Object} [params.location] - Incident location
   * @returns {Promise<{ success: boolean, providerMessageId: string|null, status: string, error: string|null, rawResponse: any }>}
   */
  async sendMessage(params) {
    throw new Error('sendMessage() must be implemented by provider adapter');
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
