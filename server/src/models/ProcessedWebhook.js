import mongoose from 'mongoose';

const processedWebhookSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    event: {
      type: String,
      required: true
    },
    provider: {
      type: String,
      default: 'razorpay'
    },
    status: {
      type: String,
      enum: ['processing', 'processed', 'failed'],
      default: 'processed'
    },
    payloadSummary: {
      orderId: String,
      paymentId: String,
      amount: Number
    },
    processedAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 30 // TTL auto-cleanup after 30 days
    }
  },
  { timestamps: true }
);

export const ProcessedWebhook = mongoose.model('ProcessedWebhook', processedWebhookSchema);
