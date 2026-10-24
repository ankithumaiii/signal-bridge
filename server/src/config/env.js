import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/signal_bridge',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  demoMode: process.env.DEMO_MODE !== 'false',

  // SMS Configuration
  smsProvider: process.env.SMS_PROVIDER || 'msg91',
  msg91AuthKey: process.env.MSG91_AUTH_KEY || '',
  msg91SenderId: process.env.MSG91_SENDER_ID || 'SIGBRG',
  msg91TemplateId: process.env.MSG91_TEMPLATE_ID || '',
  smsTestAllowlist: (process.env.SMS_TEST_ALLOWLIST || '')
    .split(',')
    .map((s) => s.replace(/[^\d]/g, '').trim())
    .filter(Boolean),

  // Razorpay Payments Configuration
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  // WhatsApp Cloud API Configuration (Meta Graph API)
  whatsappEnabled: process.env.WHATSAPP_ENABLED === 'true',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION || 'v22.0',
  whatsappTemplateName: process.env.WHATSAPP_TEMPLATE_NAME || '',
  whatsappTemplateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US',
  whatsappTestAllowlist: (process.env.WHATSAPP_TEST_ALLOWLIST || process.env.SMS_TEST_ALLOWLIST || '')
    .split(',')
    .map((s) => s.replace(/[^\d]/g, '').trim())
    .filter(Boolean)
};
