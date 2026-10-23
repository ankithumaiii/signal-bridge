import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: ''
    },
    medicalNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    lastKnownLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      updatedAt: { type: Date, default: null }
    },
    locationSharing: {
      enabled: { type: Boolean, default: false },
      expiresAt: { type: Date, default: null }
    },
    isDemoUser: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Never expose password hash in toJSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model('User', userSchema);
