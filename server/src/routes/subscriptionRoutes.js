import express from 'express';
import {
  getPlans,
  getCurrentSubscription,
  cancelSubscription
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public plan catalog
router.get('/plans', getPlans);

// Protected user subscription state
router.get('/current', protect, getCurrentSubscription);
router.post('/cancel', protect, cancelSubscription);

export default router;
