import { z } from 'zod';
import { SOSIncident } from '../models/SOSIncident.js';
import { Contact } from '../models/Contact.js';
import { User } from '../models/User.js';
import { dispatchSOSNotifications, formatEmergencySummary } from '../services/notificationService.js';
import { smsService } from '../services/sms/smsService.js';

export const createSOSSchema = z.object({
  body: z.object({
    category: z.enum([
      'Medical Emergency',
      'Accident',
      'Personal Safety',
      'Violence or Threat',
      'Fire',
      'Lost or Stranded',
      'Other'
    ]),
    description: z.string().max(1000).optional().default(''),
    location: z.object({
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
      accuracy: z.number().nullable().optional(),
      isCurrent: z.boolean().optional().default(true),
      address: z.string().optional().default('GPS coordinates attached')
    }).optional(),
    selectedContactIds: z.array(z.string()).optional()
  })
});

// Create new persistent SOS incident
export const createSOS = async (req, res, next) => {
  try {
    const { category, description, location, selectedContactIds } = req.body;

    // Generate readable incident number e.g. SB-2026-784291
    const randomSuffix = `${Math.floor(1000 + Math.random() * 9000)}${Date.now().toString().slice(-3)}`;
    const incidentNumber = `SB-2026-${randomSuffix}`;

    // Query trusted contacts who have notifyInEmergency = true
    let contactQuery = { userId: req.user._id, notifyInEmergency: true };
    if (selectedContactIds && selectedContactIds.length > 0) {
      contactQuery._id = { $in: selectedContactIds };
    }
    const contacts = await Contact.find(contactQuery);

    // Format map URL if coordinates exist
    let mapUrl = '';
    if (location && location.lat !== null && location.lng !== null) {
      mapUrl = `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=16/${location.lat}/${location.lng}`;
    }

    // Persist incident in MongoDB
    const incident = new SOSIncident({
      incidentNumber,
      userId: req.user._id,
      category,
      description: description || 'Immediate assistance requested.',
      location: {
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        accuracy: location?.accuracy ?? null,
        isCurrent: location?.isCurrent ?? true,
        address: location?.address || (location?.lat ? 'GPS location verified' : 'GPS location unavailable'),
        mapUrl
      },
      status: 'active',
      auditTrail: [
        {
          status: 'active',
          note: 'SOS triggered by user.',
          timestamp: new Date()
        }
      ]
    });

    // Dispatch notifications to contacts (honest state tracking via SMSService)
    const recipientStatuses = await dispatchSOSNotifications({ incident, contacts, user: req.user });
    incident.recipients = recipientStatuses;

    await incident.save();

    // Also update user's lastKnownLocation if coords provided
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

    const emergencySummary = formatEmergencySummary({ incident, user: req.user });

    // Emit realtime event via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.emit('sos_alert', {
        incidentNumber: incident.incidentNumber,
        category: incident.category,
        userName: req.user.name,
        location: incident.location,
        createdAt: incident.createdAt
      });
    }

    res.status(201).json({
      success: true,
      message: 'Emergency SOS incident created and notifications dispatched.',
      incident,
      emergencySummary
    });
  } catch (err) {
    next(err);
  }
};

// Get current active SOS incident for this user
export const getActiveSOS = async (req, res, next) => {
  try {
    const incident = await SOSIncident.findOne({
      userId: req.user._id,
      status: { $in: ['active', 'acknowledged'] }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      incident: incident || null
    });
  } catch (err) {
    next(err);
  }
};

// Get SOS history for this user
export const getSOSHistory = async (req, res, next) => {
  try {
    const incidents = await SOSIncident.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: incidents.length,
      incidents
    });
  } catch (err) {
    next(err);
  }
};

// Update SOS status (e.g. resolve or cancel)
export const updateSOSStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!['resolved', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update.' });
    }

    const incident = await SOSIncident.findOne({ _id: id, userId: req.user._id });
    if (!incident) {
      return res.status(404).json({ success: false, message: 'SOS Incident not found or unauthorized.' });
    }

    incident.status = status;
    incident.auditTrail.push({
      status,
      note: note || `Incident marked as ${status} by user.`,
      timestamp: new Date()
    });

    await incident.save();

    res.json({
      success: true,
      message: `SOS incident marked as ${status}.`,
      incident
    });
  } catch (err) {
    next(err);
  }
};

// Log user action initiating emergency call (e.g., Call 112)
export const log112Call = async (req, res, next) => {
  try {
    const { incidentId, notes } = req.body;

    let incident = null;
    if (incidentId) {
      incident = await SOSIncident.findOne({ _id: incidentId, userId: req.user._id });
    } else {
      incident = await SOSIncident.findOne({ userId: req.user._id, status: 'active' }).sort({ createdAt: -1 });
    }

    if (incident) {
      incident.emergencyServicesAction = {
        called112: true,
        callInitiatedAt: new Date(),
        status: 'call_action_initiated_by_user',
        notes: notes || 'User initiated Call 112 on mobile dialer.'
      };

      incident.auditTrail.push({
        status: 'call_112_initiated',
        note: 'Official Emergency 112 call dialer opened by user.',
        timestamp: new Date()
      });

      await incident.save();
    }

    res.json({
      success: true,
      message: 'Emergency 112 call action recorded. Call initiated on client device.',
      emergencyServicesAction: incident?.emergencyServicesAction || { called112: true, status: 'call_action_initiated_by_user' }
    });
  } catch (err) {
    next(err);
  }
};

// Acknowledge SOS recipient alert
export const acknowledgeRecipient = async (req, res, next) => {
  try {
    const { incidentId, contactId, note } = req.body;

    const incident = await SOSIncident.findById(incidentId);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    let updated = false;
    incident.recipients = incident.recipients.map((rec) => {
      if (rec.contactId?.toString() === contactId || rec.phone === req.user.phone) {
        rec.status = 'acknowledged';
        rec.acknowledgedAt = new Date();
        rec.acknowledgementNote = note || 'Acknowledged by contact.';
        updated = true;
      }
      return rec;
    });

    if (updated) {
      incident.auditTrail.push({
        status: 'recipient_acknowledged',
        note: `Alert acknowledged by recipient (${req.user.name || 'Contact'}).`,
        timestamp: new Date()
      });
      await incident.save();
    }

    res.json({
      success: true,
      message: 'Acknowledgement logged.',
      incident
    });
  } catch (err) {
    next(err);
  }
};

// Inspect recipient notification delivery progress (Authorized to incident owner)
export const getIncidentNotifications = async (req, res, next) => {
  try {
    const { id } = req.params;
    const incident = await SOSIncident.findOne({ _id: id, userId: req.user._id });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'SOS incident not found or unauthorized.'
      });
    }

    res.json({
      success: true,
      incidentNumber: incident.incidentNumber,
      status: incident.status,
      recipients: incident.recipients,
      updatedAt: incident.updatedAt
    });
  } catch (err) {
    next(err);
  }
};

// Safe, authenticated test-SMS endpoint (Strictly non-emergency, never creates incident or contacts 112)
export const sendTestSMS = async (req, res, next) => {
  try {
    const to = req.body?.to || req.user?.phone;
    if (!to) {
      return res.status(400).json({
        success: false,
        blocker: 'MISSING_PHONE',
        message: 'Destination phone number is required in request body or user profile.'
      });
    }

    const result = await smsService.sendTestSMS({ to, user: req.user });

    if (result.blocker === 'MISSING_PROVIDER_CREDENTIALS') {
      return res.status(503).json(result);
    }
    if (result.blocker === 'RESTRICTED_ALLOWLIST') {
      return res.status(403).json(result);
    }
    if (result.blocker === 'INVALID_PHONE_FORMAT' || result.blocker === 'INVALID_RECIPIENT') {
      return res.status(400).json(result);
    }
    if (!result.success) {
      return res.status(502).json(result);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};
