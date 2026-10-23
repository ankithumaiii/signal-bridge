import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    contactUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: 100
    },
    relationship: {
      type: String,
      enum: ['Parent', 'Spouse', 'Sibling', 'Child', 'Partner', 'Friend', 'Colleague', 'Neighbor', 'Other'],
      default: 'Family'
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    notifyInEmergency: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['invited', 'connected'],
      default: 'invited'
    },
    locationConsentGranted: {
      type: Boolean,
      default: false
    },
    lastCheckInReceived: {
      type: {
        type: String,
        enum: ['safe', 'need_help', 'location_ping', null],
        default: null
      },
      message: { type: String, default: '' },
      timestamp: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

// Compound index so a user doesn't duplicate phone numbers
contactSchema.index({ userId: 1, phone: 1 });

export const Contact = mongoose.model('Contact', contactSchema);
