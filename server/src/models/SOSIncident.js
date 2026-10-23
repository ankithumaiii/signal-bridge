import mongoose from 'mongoose';

const sosRecipientNotificationSchema = new mongoose.Schema(
  {
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    channel: { type: String, enum: ['sms', 'in_app', 'simulated_dispatch'], default: 'simulated_dispatch' },
    status: {
      type: String,
      enum: ['draft', 'queued_locally', 'submitted', 'sent', 'delivered', 'acknowledged', 'failed'],
      default: 'submitted'
    },
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    acknowledgedAt: { type: Date, default: null },
    acknowledgementNote: { type: String, default: '' },
    isDemoSimulated: { type: Boolean, default: true }
  },
  { _id: false }
);

const sosIncidentSchema = new mongoose.Schema(
  {
    incidentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Medical Emergency',
        'Accident',
        'Personal Safety',
        'Violence or Threat',
        'Fire',
        'Lost or Stranded',
        'Other'
      ]
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      isCurrent: { type: Boolean, default: true },
      address: { type: String, default: 'Location captured via GPS' },
      mapUrl: { type: String, default: '' }
    },
    status: {
      type: String,
      enum: ['draft', 'queued_locally', 'active', 'acknowledged', 'resolved', 'cancelled'],
      default: 'active'
    },
    recipients: [sosRecipientNotificationSchema],
    emergencyServicesAction: {
      called112: { type: Boolean, default: false },
      callInitiatedAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ['uninitiated', 'call_action_initiated_by_user', 'assistance_confirmed_by_user'],
        default: 'uninitiated'
      },
      notes: { type: String, default: '' }
    },
    auditTrail: [
      {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const SOSIncident = mongoose.model('SOSIncident', sosIncidentSchema);
