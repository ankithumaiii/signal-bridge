import { z } from 'zod';
import { Contact } from '../models/Contact.js';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';

export const contactSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    relationship: z.enum(['Parent', 'Spouse', 'Sibling', 'Child', 'Partner', 'Friend', 'Colleague', 'Neighbor', 'Other']).default('Other'),
    phone: z.string().min(7, 'Phone number must be at least 7 digits'),
    email: z.string().email().optional().or(z.literal('')),
    notifyInEmergency: z.boolean().default(true)
  })
});

export const getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find({ userId: req.user._id })
      .populate('contactUserId', 'name email phone lastKnownLocation locationSharing')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: contacts.length,
      contacts
    });
  } catch (err) {
    next(err);
  }
};

export const addContact = async (req, res, next) => {
  try {
    const { name, relationship, phone, email, notifyInEmergency } = req.body;

    // Check if phone or email matches an existing registered user
    let linkedUser = null;
    if (phone) {
      linkedUser = await User.findOne({ phone: phone.trim() });
    }
    if (!linkedUser && email) {
      linkedUser = await User.findOne({ email: email.toLowerCase().trim() });
    }

    // Don't let users add themselves
    if (linkedUser && linkedUser._id.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add yourself as an emergency contact.'
      });
    }

    // Check if contact with same phone already exists for this user
    const existing = await Contact.findOne({ userId: req.user._id, phone: phone.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A contact with this phone number already exists in your list.'
      });
    }

    const contact = await Contact.create({
      userId: req.user._id,
      contactUserId: linkedUser ? linkedUser._id : null,
      name,
      relationship: relationship || 'Family',
      phone: phone.trim(),
      email: email ? email.toLowerCase().trim() : '',
      notifyInEmergency: notifyInEmergency !== undefined ? notifyInEmergency : true,
      status: linkedUser ? 'connected' : 'invited'
    });

    res.status(201).json({
      success: true,
      message: linkedUser
        ? 'Contact added and connected to registered Signal Bridge member.'
        : 'Contact added. Invitation pending registration.',
      contact
    });
  } catch (err) {
    next(err);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, relationship, phone, email, notifyInEmergency, locationConsentGranted } = req.body;

    const contact = await Contact.findOne({ _id: id, userId: req.user._id });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found or unauthorized' });
    }

    if (name) contact.name = name;
    if (relationship) contact.relationship = relationship;
    if (phone) contact.phone = phone.trim();
    if (email !== undefined) contact.email = email.trim();
    if (notifyInEmergency !== undefined) contact.notifyInEmergency = notifyInEmergency;
    if (locationConsentGranted !== undefined) contact.locationConsentGranted = locationConsentGranted;

    await contact.save();

    res.json({
      success: true,
      message: 'Contact updated.',
      contact
    });
  } catch (err) {
    next(err);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found or unauthorized' });
    }

    res.json({
      success: true,
      message: 'Contact removed from your emergency list.'
    });
  } catch (err) {
    next(err);
  }
};

// Family Check-In (e.g. "I'm Safe" or "I Need Help")
export const sendCheckIn = async (req, res, next) => {
  try {
    const { status, message, location } = req.body;
    if (!['safe', 'need_help'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be either "safe" or "need_help"' });
    }

    // Update contacts of this user with the check-in
    await Contact.updateMany(
      { userId: req.user._id },
      {
        lastCheckInReceived: {
          type: status,
          message: message || (status === 'safe' ? "I am safe and secure." : "I need assistance."),
          timestamp: new Date()
        }
      }
    );

    // Also update any other users who have this user as a contact
    await Contact.updateMany(
      { contactUserId: req.user._id },
      {
        lastCheckInReceived: {
          type: status,
          message: message || (status === 'safe' ? `${req.user.name} checked in: Safe.` : `${req.user.name} checked in: Needs help.`),
          timestamp: new Date()
        }
      }
    );

    // Also record user location if provided
    if (location && location.lat && location.lng) {
      await User.findByIdAndUpdate(req.user._id, {
        lastKnownLocation: {
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy || null,
          updatedAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      message: status === 'safe' ? 'Check-in sent: You are marked as Safe.' : 'Check-in sent: Need Help alert dispatched to family.',
      timestamp: new Date()
    });
  } catch (err) {
    next(err);
  }
};
