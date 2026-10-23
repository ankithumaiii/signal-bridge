import { smsService } from './sms/smsService.js';

/**
 * Dispatch SOS Notifications to recipient contacts via configured SMS service
 */
export const dispatchSOSNotifications = async ({ incident, contacts, user }) => {
  return smsService.dispatchSOSAlert({ incident, contacts, user });
};

/**
 * Format phonetic text readout for ERSS 112 dispatcher
 */
export const formatEmergencySummary = ({ incident, user }) => {
  const loc = incident.location;
  const hasCoords = loc && loc.lat !== null && loc.lng !== null;
  const mapLink = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=16/${loc.lat}/${loc.lng}`
    : 'Coordinates unavailable';

  return `[SIGNAL BRIDGE EMERGENCY ALERT]
Name: ${user?.name || 'Citizen'}
Category: ${incident.category}
Incident ID: ${incident.incidentNumber}
Description: ${incident.description || 'Emergency assistance requested'}
Medical: ${user?.medicalNotes || 'None specified'}
Location: ${hasCoords ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)} (±${loc.accuracy || '?'}m)` : 'GPS unavailable'}
Map: ${mapLink}
Timestamp: ${new Date(incident.createdAt || Date.now()).toLocaleString()}
Official Emergency (India): 112`;
};
