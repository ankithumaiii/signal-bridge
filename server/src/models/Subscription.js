import mongoose from 'mongoose';

const paymentRecordSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true }, // in paise
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['captured', 'failed', 'refunded'], default: 'captured' },
    method: { type: String, default: 'upi_card' },
    paidAt: { type: Date, default: Date.now },
    errorDescription: { type: String, default: null }
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    planId: {
      type: String,
      required: true,
      enum: ['free', 'plus_monthly', 'plus_annual'],
      default: 'free'
    },
    status: {
      type: String,
      required: true,
      enum: ['free', 'pending', 'active', 'past_due', 'cancelled', 'expired'],
      default: 'free',
      index: true
    },
    billingProvider: {
      type: String,
      enum: ['razorpay', 'manual', 'none'],
      default: 'none'
    },
    providerCustomerId: {
      type: String,
      default: ''
    },
    providerSubscriptionId: {
      type: String,
      default: ''
    },
    providerOrderId: {
      type: String,
      default: ''
    },
    providerPaymentId: {
      type: String,
      default: ''
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      default: null
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    paymentHistory: [paymentRecordSchema]
  },
  { timestamps: true }
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
