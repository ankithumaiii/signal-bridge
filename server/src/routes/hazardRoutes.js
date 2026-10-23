import express from 'express';
import {
  getHazards,
  checkDuplicates,
  createHazard,
  corroborateHazard,
  flagHazard,
  resolveHazard,
  getMyHazards,
  createHazardSchema
} from '../controllers/hazardController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reportLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Publicly readable hazard map radar
router.get('/', getHazards);
router.get('/check-duplicates', checkDuplicates);

// Protected routes
router.post('/', protect, reportLimiter, validate(createHazardSchema), createHazard);
router.get('/my', protect, getMyHazards);
router.post('/:id/corroborate', protect, corroborateHazard);
router.post('/:id/flag', protect, flagHazard);
router.put('/:id/resolve', protect, resolveHazard);

export default router;
