import express from 'express';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  createConversationSchema,
  sendMessageSchema
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.post('/conversations', validate(createConversationSchema), createConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', validate(sendMessageSchema), sendMessage);

export default router;
