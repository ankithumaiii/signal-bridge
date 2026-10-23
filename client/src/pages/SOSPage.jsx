import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  PhoneCall,
  MapPin,
  CheckCircle,
  Clock,
  ShieldAlert,
  Send,
  Navigation,
  RefreshCw,
  XCircle,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { useOffline } from '../context/OfflineContext.jsx';
import { api } from '../services/api.js';
import { enqueueOfflineAction } from '../services/offlineQueue.js';
import { SOSButton } from '../components/SOSButton.jsx';
import { Call112Button } from '../components/Call112Button.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

export const SOSPage = () => {
  const { user } = useAuth();
  const { coords, requestLocation, status: locStatus } = useLocation();
  const { isOnline } = useOffline();

  const [activeIncident, setActiveIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState('Medical Emergency');
  const [description, setDescription] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [emergencySummary, setEmergencySummary] = useState('');
  const [copied, setCopied] = useState(false);

  const categories = [
    'Medical Emergency',
    'Accident',
    'Personal Safety',
    'Violence or Threat',
    'Fire',
    'Lost or Stranded',
    'Other'
  ];

  // Fetch active SOS and user contacts
  const fetchSOSState = async () => {
    try {
      const [activeRes, contactsRes] = await Promise.all([
        api.getActiveSOS(),
        api.getContacts()
      ]);

      if (activeRes.success && activeRes.incident) {
        setActiveIncident(activeRes.incident);
        generateSummary(activeRes.incident);
      } else {
        setActiveIncident(null);
      }

      if (contactsRes.success) {
        setContacts(contactsRes.contacts);
        // By default select contacts who have notifyInEmergency = true
        setSelectedContacts(
          contactsRes.contacts
            .filter((c) => c.notifyInEmergency)
            .map((c) => c._id)
        );
      }
    } catch (err) {
      console.warn('Error fetching SOS state:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSOSState();
    // Auto-attempt location request
    if (!coords) {
      requestLocation();
    }
  }, []);

  const generateSummary = (incident) => {
    const loc = incident.location;
    const hasLoc = loc && loc.lat !== null && loc.lng !== null;
    const text = `[SIGNAL BRIDGE EMERGENCY ALERT]
Name: ${user?.name || 'Citizen'}
Incident ID: ${incident.incidentNumber}
Category: ${incident.category}
Medical: ${user?.medicalNotes || 'None specified'}
Location: ${hasLoc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)} (±${loc.accuracy || '?'}m)` : 'GPS signal unavailable'}
Map Link: ${loc?.mapUrl || 'N/A'}
Emergency Services (India): 112`;
    setEmergencySummary(text);
  };

  const handleTriggerSOS = async () => {
    setSubmitting(true);
    try {
      const payload = {
        category,
        description: description || `Emergency alert triggered by ${user?.name || 'user'}.`,
        location: coords
          ? {
              lat: coords.lat,
              lng: coords.lng,
              accuracy: coords.accuracy,
              isCurrent: true,
              address: 'GPS coordinates verified via browser'
            }
          : {
              lat: null,
              lng: null,
              accuracy: null,
              isCurrent: false,
              address: 'Location permission not granted or GPS unavailable'
            },
        selectedContactIds: selectedContacts
      };

      if (!isOnline) {
        // Enqueue offline action safely
        enqueueOfflineAction({
          type: 'create_sos',
          payload
        });
        alert('You are currently offline. Your SOS alert has been saved locally and will transmit to contacts the moment connection restores.');
        return;
      }

      const res = await api.createSOS(payload);
      if (res.success && res.incident) {
        setActiveIncident(res.incident);
        setEmergencySummary(res.emergencySummary || '');
      }
    } catch (err) {
      alert(`Could not trigger SOS: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveIncident = async (newStatus) => {
    if (!activeIncident) return;
    const confirm = window.confirm(`Are you sure you want to mark this emergency as ${newStatus}?`);
    if (!confirm) return;

    try {
      await api.updateSOSStatus(activeIncident._id, {
        status: newStatus,
        note: `Marked as ${newStatus} by user.`
      });
      setActiveIncident(null);
      setDescription('');
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Demo action: simulate contact acknowledgement
  const handleSimulateAcknowledgement = async (contactId) => {
    if (!activeIncident) return;
    try {
      await api.acknowledgeSOS({
        incidentId: activeIncident._id,
        contactId,
        note: 'Confirmed received on phone dialer. Help is on the way.'
      });
      fetchSOSState();
    } catch (err) {
      console.warn('Ack failed:', err.message);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(emergencySummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          <ShieldAlert size={28} color="var(--sos-red)" /> Emergency SOS Activation
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Real-time incident dispatch, emergency calling, and family coordination
        </p>
      </div>

      {/* Immediate Call 112 Bar (Never delayed, always accessible) */}
      <div className="card" style={{
        background: 'rgba(230, 57, 70, 0.12)',
        border: '1px solid rgba(230, 57, 70, 0.4)',
        padding: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FF6B6B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PhoneCall size={18} /> Immediate Emergency Calling (India ERSS 112)
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Police • Fire • Ambulance • Disaster Helpline. Accessible without GPS or internet.
            </div>
          </div>
          <div style={{ minWidth: '220px' }}>
            <Call112Button incidentId={activeIncident?._id} emergencySummary={emergencySummary} variant="primary" />
          </div>
        </div>
      </div>

      {/* Active Incident State or Inactive Trigger Form */}
      {activeIncident ? (
        <div className="card" style={{ border: '2px solid var(--sos-red)', padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <span className="badge badge-critical" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                SOS ACTIVE • {activeIncident.incidentNumber}
              </span>
              <h2 style={{ fontSize: '1.4rem', marginTop: '0.5rem', color: '#FFFFFF' }}>
                {activeIncident.category}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => handleResolveIncident('resolved')} className="btn btn-secondary btn-sm" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', borderColor: '#10B981' }}>
                <CheckCircle size={15} /> Resolve Emergency
              </button>
              <button onClick={() => handleResolveIncident('cancelled')} className="btn btn-secondary btn-sm">
                <XCircle size={15} /> Cancel SOS
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.95rem', marginBottom: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <strong>Note:</strong> {activeIncident.description || 'Emergency SOS triggered.'}
          </p>

          {/* Location Details */}
          <div style={{
            background: 'rgba(11, 19, 43, 0.7)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Navigation size={15} /> Incident Coordinates
            </div>
            <div style={{ fontSize: '0.9rem', color: '#FFFFFF' }}>
              {activeIncident.location?.lat && activeIncident.location?.lng ? (
                <>
                  <span>Lat: {activeIncident.location.lat.toFixed(5)}, Lng: {activeIncident.location.lng.toFixed(5)}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>(Accuracy: ±{activeIncident.location.accuracy || '?'}m)</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>GPS coordinates were not available at time of trigger.</span>
              )}
            </div>
          </div>

          {/* Recipient Notification States */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Send size={16} color="var(--brand-blue)" /> Trusted Contact Notification Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activeIncident.recipients?.map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFFFFF' }}>{rec.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rec.phone} • {rec.channel}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <StatusBadge status={rec.status} type="notification" />
                    {rec.status !== 'acknowledged' && (
                      <button
                        onClick={() => handleSimulateAcknowledgement(rec.contactId)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', height: '26px' }}
                        title="Simulate recipient tapping acknowledged on phone"
                      >
                        [DEMO] Simulate Ack
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Readout Summary Clipboard Card */}
          {emergencySummary && (
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  112 Operator Dispatch Readout
                </span>
                <button onClick={copySummary} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                  {copied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre style={{ fontSize: '0.8rem', color: '#E2E8F0', whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0 }}>
                {emergencySummary}
              </pre>
            </div>
          )}
        </div>
      ) : (
        /* Inactive SOS Trigger Configuration & Button */
        <div className="card" style={{ padding: '2rem 1.5rem', marginBottom: '1.5rem' }}>
          {/* Big Accessible Press-and-Hold Button */}
          <div style={{ margin: '1rem 0 2rem 0', display: 'flex', justifyContent: 'center' }}>
            <SOSButton onTrigger={handleTriggerSOS} disabled={submitting} />
          </div>

          {/* Emergency Category Selector */}
          <div className="form-group">
            <label className="form-label">Emergency Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: category === cat ? 'rgba(230, 57, 70, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${category === cat ? 'var(--sos-red)' : 'var(--border-subtle)'}`,
                    color: category === cat ? '#FF6B6B' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textAlign: 'left'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Emergency Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Short Emergency Note (Optional)
            </label>
            <textarea
              id="description"
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Inhaler needed, stuck in underpass flooding..."
            ></textarea>
          </div>

          {/* Location Status Bar */}
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} color={coords ? 'var(--color-success)' : 'var(--color-warning)'} />
              <span style={{ fontSize: '0.85rem' }}>
                {coords
                  ? `GPS coordinates locked (±${coords.accuracy}m)`
                  : 'GPS location pending permission'}
              </span>
            </div>
            {!coords && (
              <button onClick={requestLocation} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                Acquire GPS Now
              </button>
            )}
          </div>

          {/* Contact Dispatch Selection */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              Recipients ({selectedContacts.length} selected to receive notification)
            </label>
            {contacts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {contacts.map((c) => {
                  const isChecked = selectedContacts.includes(c._id);
                  return (
                    <label
                      key={c._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isChecked ? 'rgba(58, 134, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isChecked ? 'rgba(58, 134, 255, 0.3)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.name} ({c.relationship})</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedContacts((prev) =>
                            prev.includes(c._id) ? prev.filter((id) => id !== c._id) : [...prev, c._id]
                          );
                        }}
                        style={{ width: '18px', height: '18px' }}
                      />
                    </label>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No trusted contacts configured yet. Go to the Family tab to add emergency contacts.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
