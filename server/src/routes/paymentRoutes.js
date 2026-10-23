import express from 'express';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  createOrderSchema,
  verifyPaymentSchema
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Webhook endpoint (unauthenticated, HMAC signature-verified via raw request body)
router.post('/webhook', handleWebhook);

// Authenticated payment actions
router.post('/create-order', protect, validate(createOrderSchema), createOrder);
router.post('/verify', protect, validate(verifyPaymentSchema), verifyPayment);

export default router;
