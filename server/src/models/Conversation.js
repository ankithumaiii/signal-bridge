import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'family_group'],
      default: 'direct'
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    lastMessage: {
      text: { type: String, default: '' },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

conversationSchema.index({ members: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
