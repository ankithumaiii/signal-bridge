import { z } from 'zod';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

export const createConversationSchema = z.object({
  body: z.object({
    recipientId: z.string().optional(),
    type: z.enum(['direct', 'family_group']).default('direct'),
    title: z.string().optional().default(''),
    memberIds: z.array(z.string()).optional()
  })
});

export const sendMessageSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Message text cannot be empty').max(2000),
    messageType: z.enum(['text', 'checkin_safe', 'checkin_help', 'location_ping', 'sos_alert']).default('text'),
    location: z.object({
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
      accuracy: z.number().nullable().optional()
    }).optional(),
    idempotencyKey: z.string().optional(),
    transportUsed: z.enum(['internet_socket', 'internet_http', 'local_offline_queued', 'demo_simulation']).default('internet_http')
  })
});

// Get conversations the user belongs to
export const getConversations = async (req, res, next) => {
  try {
    let conversations = await Conversation.find({ members: req.user._id })
      .populate('members', 'name email phone lastKnownLocation')
      .populate('lastMessage.senderId', 'name')
      .sort({ updatedAt: -1 });

    // If user has no conversations, automatically find or create a "Family Emergency Group"
    if (conversations.length === 0) {
      const familyGroup = await Conversation.create({
        type: 'family_group',
        title: 'Family Emergency Circle',
        members: [req.user._id],
        lastMessage: {
          text: 'Family safety circle initialized. Keep touch during emergencies.',
          timestamp: new Date()
        }
      });
      await familyGroup.populate('members', 'name email phone lastKnownLocation');
      conversations = [familyGroup];
    }

    res.json({
      success: true,
      conversations
    });
  } catch (err) {
    next(err);
  }
};

// Create or get existing direct/group conversation
export const createConversation = async (req, res, next) => {
  try {
    const { recipientId, type, title, memberIds } = req.body;

    if (type === 'direct' && recipientId) {
      // Find if direct conversation already exists
      const existing = await Conversation.findOne({
        type: 'direct',
        members: { $all: [req.user._id, recipientId], $size: 2 }
      }).populate('members', 'name email phone');

      if (existing) {
        return res.json({ success: true, conversation: existing });
      }

      const newConv = await Conversation.create({
        type: 'direct',
        members: [req.user._id, recipientId]
      });
      await newConv.populate('members', 'name email phone');

      return res.status(201).json({ success: true, conversation: newConv });
    }

    // Family Group
    const allMembers = Array.from(new Set([req.user._id.toString(), ...(memberIds || [])]));
    const newGroup = await Conversation.create({
      type: 'family_group',
      title: title || 'Family Emergency Circle',
      members: allMembers
    });
    await newGroup.populate('members', 'name email phone');

    res.status(201).json({ success: true, conversation: newGroup });
  } catch (err) {
    next(err);
  }
};

// Get messages for a specific conversation
export const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check conversation exists and user is a member
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isMember = conversation.members.some((m) => m.equals(req.user._id));
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this conversation.' });
    }

    const messages = await Message.find({ conversationId: id })
      .populate('senderId', 'name email')
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (err) {
    next(err);
  }
};

// Send a message inside a conversation
export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, messageType, location, idempotencyKey, transportUsed } = req.body;

    // Ensure user is member
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isMember = conversation.members.some((m) => m.equals(req.user._id));
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this conversation.' });
    }

    // Check idempotency if key is present (prevent duplicate replay from offline queue)
    if (idempotencyKey) {
      const existingMsg = await Message.findOne({ idempotencyKey });
      if (existingMsg) {
        await existingMsg.populate('senderId', 'name email');
        return res.json({
          success: true,
          message: 'Message already received (idempotent submission).',
          data: existingMsg
        });
      }
    }

    const msg = await Message.create({
      conversationId: id,
      senderId: req.user._id,
      text,
      messageType: messageType || 'text',
      location: location || null,
      status: 'delivered', // Delivered to backend server
      idempotencyKey: idempotencyKey || null,
      transportUsed: transportUsed || 'internet_http'
    });

    await msg.populate('senderId', 'name email');

    // Update conversation lastMessage
    conversation.lastMessage = {
      text: text.slice(0, 80),
      senderId: req.user._id,
      timestamp: new Date()
    };
    await conversation.save();

    // Broadcast over WebSocket room
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${id}`).emit('new_message', {
        message: msg
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent.',
      data: msg
    });
  } catch (err) {
    next(err);
  }
};
