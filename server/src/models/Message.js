import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    messageType: {
      type: String,
      enum: ['text', 'checkin_safe', 'checkin_help', 'location_ping', 'sos_alert'],
      default: 'text'
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      accuracy: { type: Number, default: null }
    },
    status: {
      type: String,
      enum: ['queued', 'submitted', 'delivered', 'failed'],
      default: 'submitted'
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    transportUsed: {
      type: String,
      enum: ['internet_socket', 'internet_http', 'local_offline_queued', 'demo_simulation'],
      default: 'internet_http'
    }
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);
