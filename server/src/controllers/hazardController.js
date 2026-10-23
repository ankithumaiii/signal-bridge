import { z } from 'zod';
import { Hazard } from '../models/Hazard.js';
import {
  evaluateHazardVerification,
  findNearbySimilarHazards,
  calculateDistanceMeters
} from '../services/verificationService.js';

export const createHazardSchema = z.object({
  body: z.object({
    category: z.enum([
      'Accident',
      'Fire or Smoke',
      'Flooding or Severe Weather',
      'Blocked or Unsafe Road',
      'Violence or Public Safety',
      'Medical Emergency',
      'Other Hazard'
    ]),
    severity: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
    description: z.string().min(5, 'Description must be at least 5 characters').max(1000),
    location: z.object({
      lat: z.number({ required_error: 'Latitude is required' }),
      lng: z.number({ required_error: 'Longitude is required' }),
      address: z.string().optional().default('Pinned location')
    }),
    photoUrl: z.string().optional().default(''),
    eventTime: z.string().datetime().optional()
  })
});

// Get all active hazards for the safety map with optional filters
export const getHazards = async (req, res, next) => {
  try {
    const { category, severity, status, search, includeResolved } = req.query;

    const query = {};

    if (!includeResolved || includeResolved === 'false') {
      query.status = { $nin: ['Resolved', 'Expired'] };
    }

    if (category) {
      query.category = category;
    }

    if (severity) {
      query.severity = severity;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ];
    }

    const hazards = await Hazard.find(query).sort({ createdAt: -1 }).limit(100);

    // Public sanitization: ensure reporter sensitive credentials are never leaked
    const sanitizedHazards = hazards.map((h) => {
      const obj = h.toObject();
      const isOwner = req.user && h.reporterId.equals(req.user._id);
      obj.isOwner = isOwner;
      delete obj.reporterId;
      return obj;
    });

    res.json({
      success: true,
      count: sanitizedHazards.length,
      hazards: sanitizedHazards,
      cachedAt: new Date()
    });
  } catch (err) {
    next(err);
  }
};

// Check for possible duplicates before or during submission
export const checkDuplicates = async (req, res, next) => {
  try {
    const { category, lat, lng } = req.query;
    if (!category || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'category, lat, and lng are required' });
    }

    const nearby = await findNearbySimilarHazards({
      category,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radiusMeters: 1000,
      windowHours: 3
    });

    res.json({
      success: true,
      potentialDuplicatesCount: nearby.length,
      potentialDuplicates: nearby.map((n) => ({
        id: n.hazard._id,
        category: n.hazard.category,
        description: n.hazard.description,
        distanceMeters: n.distanceMeters,
        status: n.hazard.status,
        createdAt: n.hazard.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
};

// Submit a new community hazard report
export const createHazard = async (req, res, next) => {
  try {
    const { category, severity, description, location, photoUrl, eventTime } = req.body;

    const hazard = new Hazard({
      reporterId: req.user._id,
      category,
      severity,
      description,
      location,
      photoUrl: photoUrl || '',
      eventTime: eventTime ? new Date(eventTime) : new Date(),
      status: 'Unverified Report',
      verificationReason: 'Single community submission awaiting local corroboration.',
      corroborationCount: 1,
      corroborations: [
        {
          userId: req.user._id,
          note: 'Initial report by author'
        }
      ]
    });

    await hazard.save();

    // Run verification engine to check for immediate clusters/corroboration
    const evaluatedHazard = await evaluateHazardVerification(hazard._id);

    // Broadcast new hazard to all connected safety map users via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('hazard_new', {
        hazard: evaluatedHazard.toPublicJSON()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Hazard report submitted and broadcasted to local safety radar.',
      hazard: evaluatedHazard.toPublicJSON()
    });
  } catch (err) {
    next(err);
  }
};

// Corroborate an existing hazard report
export const corroborateHazard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const hazard = await Hazard.findById(id);
    if (!hazard) {
      return res.status(404).json({ success: false, message: 'Hazard report not found' });
    }

    if (hazard.status === 'Resolved' || hazard.status === 'Expired') {
      return res.status(400).json({ success: false, message: 'This hazard report has already been closed.' });
    }

    // Check if user already corroborated
    const alreadyCorroborated = hazard.corroborations.some((c) => c.userId?.equals(req.user._id));
    if (alreadyCorroborated) {
      return res.status(400).json({ success: false, message: 'You have already corroborated this report.' });
    }

    hazard.corroborations.push({
      userId: req.user._id,
      note: note || 'Confirmed by nearby community member'
    });

    await hazard.save();

    // Re-evaluate verification status
    const updated = await evaluateHazardVerification(hazard._id);

    // Emit update
    const io = req.app.get('io');
    if (io) {
      io.emit('hazard_updated', {
        hazard: updated.toPublicJSON()
      });
    }

    res.json({
      success: true,
      message: 'Thank you for corroborating this hazard. Safety radar verification updated.',
      hazard: updated.toPublicJSON()
    });
  } catch (err) {
    next(err);
  }
};

// Flag a hazard report (e.g. duplicate, misleading, already cleared)
export const flagHazard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const hazard = await Hazard.findById(id);
    if (!hazard) {
      return res.status(404).json({ success: false, message: 'Hazard report not found' });
    }

    const alreadyFlagged = hazard.flags.some((f) => f.userId?.equals(req.user._id));
    if (alreadyFlagged) {
      return res.status(400).json({ success: false, message: 'You have already flagged this report.' });
    }

    hazard.flags.push({
      userId: req.user._id,
      reason: reason || 'duplicate'
    });

    // If flagged by multiple users as resolved or misleading, adjust status
    if (hazard.flags.length >= 4) {
      hazard.status = 'Resolved';
      hazard.resolutionNote = 'Community flagged as resolved or no longer present.';
      hazard.resolvedAt = new Date();
    }

    await hazard.save();

    res.json({
      success: true,
      message: 'Report flagged for review.',
      flagsCount: hazard.flags.length
    });
  } catch (err) {
    next(err);
  }
};

// Resolve a hazard report (author or community resolution)
export const resolveHazard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const hazard = await Hazard.findById(id);
    if (!hazard) {
      return res.status(404).json({ success: false, message: 'Hazard not found' });
    }

    hazard.status = 'Resolved';
    hazard.resolvedAt = new Date();
    hazard.resolvedBy = req.user._id;
    hazard.resolutionNote = note || 'Hazard cleared and verified resolved.';

    await hazard.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('hazard_resolved', {
        hazardId: hazard._id
      });
    }

    res.json({
      success: true,
      message: 'Hazard report resolved.',
      hazard: hazard.toPublicJSON()
    });
  } catch (err) {
    next(err);
  }
};

// Get hazard reports submitted by the logged-in user
export const getMyHazards = async (req, res, next) => {
  try {
    const hazards = await Hazard.find({ reporterId: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: hazards.length,
      hazards
    });
  } catch (err) {
    next(err);
  }
};
