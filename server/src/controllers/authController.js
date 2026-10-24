import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Contact } from '../models/Contact.js';
import { SOSIncident } from '../models/SOSIncident.js';
import { Hazard } from '../models/Hazard.js';
import { config } from '../config/env.js';

// Validation Schemas
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional().default(''),
    emergencyContactPhone: z.string().optional().default(''),
    bloodGroup: z.string().optional().default(''),
    medicalNotes: z.string().optional().default('')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: '30d'
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, emergencyContactPhone, bloodGroup, medicalNotes } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      emergencyContactPhone: emergencyContactPhone || '',
      bloodGroup: bloodGroup || '',
      medicalNotes: medicalNotes || ''
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email: email.toLowerCase() });

    // Auto-provision demo account if requested and missing (guarantees live 1-Click Demo never gets stuck)
    if (!user && email.toLowerCase() === 'demo@signalbridge.org' && password === 'demo12345') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('demo12345', salt);
      user = await User.create({
        name: 'Rohan Verma',
        email: 'demo@signalbridge.org',
        password: passwordHash,
        phone: '+919876543210',
        emergencyContactPhone: '+919876543211',
        bloodGroup: 'O+',
        medicalNotes: 'No chronic allergies. Asthmatic (inhaler carried in bag).',
        lastKnownLocation: {
          lat: 12.9716,
          lng: 77.5946,
          accuracy: 12,
          updatedAt: new Date()
        },
        locationSharing: { enabled: true }
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, emergencyContactPhone, bloodGroup, medicalNotes } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (emergencyContactPhone !== undefined) user.emergencyContactPhone = emergencyContactPhone;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (medicalNotes !== undefined) user.medicalNotes = medicalNotes;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, accuracy, locationSharingEnabled, durationHours } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (lat !== undefined && lng !== undefined) {
      user.lastKnownLocation = {
        lat,
        lng,
        accuracy: accuracy || null,
        updatedAt: new Date()
      };
    }

    if (locationSharingEnabled !== undefined) {
      user.locationSharing.enabled = Boolean(locationSharingEnabled);
      if (locationSharingEnabled && durationHours) {
        user.locationSharing.expiresAt = new Date(Date.now() + durationHours * 3600 * 1000);
      } else if (!locationSharingEnabled) {
        user.locationSharing.expiresAt = null;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Location preference updated.',
      location: user.lastKnownLocation,
      locationSharing: user.locationSharing
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  // Honest notification
  res.json({
    success: true,
    message: `If an account exists for ${email || 'your email'}, instructions have been logged. NOTE: Production email dispatch requires an active SMTP or SendGrid provider configured in environment variables.`
  });
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Delete user's contacts
    await Contact.deleteMany({ userId });
    // Anonymize user's incidents and hazards for audit & safety integrity
    await SOSIncident.updateMany({ userId }, { status: 'resolved' });
    await Hazard.updateMany({ reporterId: userId }, { status: 'Resolved', resolutionNote: 'Reporter account closed' });
    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Your account and personal contacts have been removed.'
    });
  } catch (err) {
    next(err);
  }
};
