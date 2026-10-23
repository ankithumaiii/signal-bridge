import { Hazard } from '../models/Hazard.js';

// Calculate distance in meters using Haversine formula
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return Infinity;
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Check for nearby matching hazards to detect potential duplicates or corroborations
export const findNearbySimilarHazards = async ({ category, lat, lng, radiusMeters = 800, windowHours = 2, excludeId = null }) => {
  const cutoffTime = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const query = {
    category,
    status: { $nin: ['Resolved', 'Expired'] },
    createdAt: { $gte: cutoffTime }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const candidates = await Hazard.find(query);

  const nearby = [];
  for (const item of candidates) {
    const dist = calculateDistanceMeters(lat, lng, item.location.lat, item.location.lng);
    if (dist <= radiusMeters) {
      nearby.push({
        hazard: item,
        distanceMeters: dist
      });
    }
  }

  return nearby;
};

// Evaluate and update hazard verification status based on transparent rules
export const evaluateHazardVerification = async (hazardId) => {
  const hazard = await Hazard.findById(hazardId);
  if (!hazard || hazard.status === 'Resolved' || hazard.status === 'Official Alert') {
    return hazard;
  }

  // Check if expired
  if (hazard.expiresAt && new Date() > hazard.expiresAt) {
    hazard.status = 'Expired';
    hazard.verificationReason = 'Hazard report expired after standard 24-hour observation window.';
    await hazard.save();
    return hazard;
  }

  const directCorroborations = hazard.corroborations ? hazard.corroborations.length : 0;

  // Find other nearby reports in the same category within 800m and within last 2 hours
  const nearby = await findNearbySimilarHazards({
    category: hazard.category,
    lat: hazard.location.lat,
    lng: hazard.location.lng,
    radiusMeters: 800,
    windowHours: 2,
    excludeId: hazard._id
  });

  const nearbyCount = nearby.length;
  const totalEvidencePoints = directCorroborations + nearbyCount;

  if (totalEvidencePoints >= 3) {
    hazard.status = 'Corroborated Hazard';
    hazard.verificationReason = `Corroborated by ${directCorroborations} direct peer confirmations and ${nearbyCount} nearby matching community reports within 800m.`;
  } else if (totalEvidencePoints >= 1) {
    hazard.status = 'Multiple Reports';
    hazard.verificationReason = `Multiple reports active: supported by ${directCorroborations} confirmations and ${nearbyCount} cluster report(s) nearby.`;
  } else {
    hazard.status = 'Unverified Report';
    hazard.verificationReason = 'Single community submission awaiting local corroboration.';
  }

  hazard.corroborationCount = 1 + totalEvidencePoints;
  await hazard.save();
  return hazard;
};
