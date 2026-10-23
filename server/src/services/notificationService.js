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
  const locInfo = smsService.formatLocation(incident?.location);
  const loc = incident?.location;
  const accuracyStr = loc && loc.accuracy ? ` (±${loc.accuracy}m)` : '';

  return `[SIGNAL BRIDGE EMERGENCY ALERT]
Name: ${user?.name || 'Citizen'}
Category: ${incident?.category || 'Emergency'}
Incident ID: ${incident?.incidentNumber || 'SOS'}
Description: ${incident?.description || 'Emergency assistance requested'}
Medical: ${user?.medicalNotes || 'None specified'}
Location: ${locInfo.hasCoords ? `${locInfo.coordsStr}${accuracyStr}` : 'GPS unavailable'}
Map: ${locInfo.hasCoords ? locInfo.googleMapsUrl : 'Coordinates unavailable'}
Timestamp: ${new Date(incident?.createdAt || Date.now()).toLocaleString()}
Official Emergency (India): 112`;
};
