import express from 'express';
import {
  createSOS,
  getActiveSOS,
  getSOSHistory,
  updateSOSStatus,
  log112Call,
  acknowledgeRecipient,
  createSOSSchema
} from '../controllers/sosController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.post('/', validate(createSOSSchema), createSOS);
router.get('/active', getActiveSOS);
router.get('/history', getSOSHistory);
router.put('/:id/status', updateSOSStatus);
router.post('/call-112', log112Call);
router.post('/acknowledge', acknowledgeRecipient);

export default router;
