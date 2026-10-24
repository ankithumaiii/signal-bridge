import { whatsappService } from '../services/whatsapp/whatsappService.js';
import { config } from '../config/env.js';

/**
 * Safe, authenticated test WhatsApp endpoint
 * Strictly non-emergency:
 * - Does NOT create an SOS incident in the database
 * - Does NOT dispatch SMS messages
 * - Does NOT initiate or log a 112 emergency call
 * - Restricts recipients to authorized allowlist or authenticated user's own phone in production
 */
export const sendTestWhatsApp = async (req, res, next) => {
  try {
    const to = req.body?.to || req.user?.phone;
    if (!to) {
      return res.status(400).json({
        success: false,
        status: 'failed',
        blocker: 'MISSING_PHONE',
        message: 'Destination phone number is required in request body or user profile.'
      });
    }

    const result = await whatsappService.sendTestWhatsApp({ to, user: req.user });

    if (result.blocker === 'MISSING_PROVIDER_CREDENTIALS') {
      return res.status(503).json(result);
    }
    if (result.blocker === 'RESTRICTED_ALLOWLIST') {
      return res.status(403).json(result);
    }
    if (result.blocker === 'INVALID_PHONE_FORMAT' || result.blocker === 'INVALID_RECIPIENT') {
      return res.status(400).json(result);
    }
    if (!result.success) {
      return res.status(502).json(result);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Get WhatsApp service readiness and public configuration metadata
 * (Tokens and sensitive secrets are strictly excluded)
 */
export const getWhatsAppStatus = async (req, res, next) => {
  try {
    const isConfigured = Boolean(config.whatsappAccessToken && config.whatsappPhoneNumberId);

    res.json({
      success: true,
      enabled: config.whatsappEnabled,
      demoMode: config.demoMode,
      configured: isConfigured,
      apiVersion: config.whatsappApiVersion,
      templateConfigured: Boolean(config.whatsappTemplateName),
      templateName: config.whatsappTemplateName || 'hello_world',
      templateLanguage: config.whatsappTemplateLanguage || 'en_US',
      allowlistCount: (config.whatsappTestAllowlist || []).length
    });
  } catch (err) {
    next(err);
  }
};
