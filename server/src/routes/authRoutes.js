import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updateLocation,
  forgotPassword,
  deleteAccount,
  registerSchema,
  loginSchema
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/forgot-password', authLimiter, forgotPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/location', protect, updateLocation);
router.delete('/account', protect, deleteAccount);

export default router;
