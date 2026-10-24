import express from 'express';
import { sendTestWhatsApp, getWhatsAppStatus } from '../controllers/whatsappController.js';
import { protect } from '../middleware/auth.js';
import { testLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect);

router.get('/status', getWhatsAppStatus);
router.post('/test', testLimiter, sendTestWhatsApp);

export default router;
