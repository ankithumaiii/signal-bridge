import express from 'express';
import {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  sendCheckIn,
  contactSchema
} from '../controllers/contactController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getContacts);
router.post('/', validate(contactSchema), addContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);
router.post('/checkin', sendCheckIn);

export default router;
