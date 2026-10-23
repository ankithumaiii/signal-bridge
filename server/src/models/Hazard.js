import mongoose from 'mongoose';

const hazardSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Hazard category is required'],
      enum: [
        'Accident',
        'Fire or Smoke',
        'Flooding or Severe Weather',
        'Blocked or Unsafe Road',
        'Violence or Public Safety',
        'Medical Emergency',
        'Other Hazard'
      ]
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1000
    },
    location: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required']
      },
      address: {
        type: String,
        default: 'Location pinned on map'
      }
    },
    photoUrl: {
      type: String,
      default: ''
    },
    eventTime: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: [
        'Unverified Report',
        'Multiple Reports',
        'Corroborated Hazard',
        'Official Alert',
        'Resolved',
        'Expired'
      ],
      default: 'Unverified Report'
    },
    verificationReason: {
      type: String,
      default: 'Single community submission awaiting local corroboration.'
    },
    corroborationCount: {
      type: Number,
      default: 1
    },
    corroborations: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' }
      }
    ],
    flags: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, enum: ['duplicate', 'misleading', 'resolved', 'spam'], default: 'duplicate' },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    resolvedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolutionNote: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours default
    },
    isDemoSeeded: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Geo compound index for fast spatial queries
hazardSchema.index({ 'location.lat': 1, 'location.lng': 1, status: 1 });

// Sanitize for public views so reporter personal identity (email, phone) is never leaked
hazardSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.reporterId;
  return obj;
};

export const Hazard = mongoose.model('Hazard', hazardSchema);
