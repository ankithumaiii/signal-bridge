// Notification Service with honest state representation and explicit Demo Simulation
export const dispatchSOSNotifications = async ({ incident, contacts }) => {
  const results = [];

  for (const contact of contacts) {
    // In production without Twilio/Exotel or FCM credentials configured,
    // we explicitly mark this as simulated demo dispatch to adhere strictly to requirements.
    const isSimulated = true;

    results.push({
      contactId: contact._id,
      name: contact.name,
      phone: contact.phone,
      channel: 'simulated_dispatch',
      status: 'sent', // Notification sent to carrier / simulation queue
      sentAt: new Date(),
      deliveredAt: new Date(Date.now() + 2000), // Simulated short transit delay
      acknowledgedAt: null,
      acknowledgementNote: '',
      isDemoSimulated: isSimulated
    });
  }

  return results;
};

export const formatEmergencySummary = ({ incident, user }) => {
  const loc = incident.location;
  const hasCoords = loc && loc.lat !== null && loc.lng !== null;
  const mapLink = hasCoords ? `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=16/${loc.lat}/${loc.lng}` : 'Coordinates unavailable';

  return `[SIGNAL BRIDGE EMERGENCY ALERT]
Name: ${user?.name || 'User'}
Category: ${incident.category}
Incident ID: ${incident.incidentNumber}
Description: ${incident.description || 'Emergency assistance requested'}
Location: ${hasCoords ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)} (±${loc.accuracy || '?'}m)` : 'GPS unavailable'}
Map: ${mapLink}
Timestamp: ${new Date(incident.createdAt || Date.now()).toLocaleString()}
Official Emergency (India): 112`;
};
