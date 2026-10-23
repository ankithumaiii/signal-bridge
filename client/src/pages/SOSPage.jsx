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
  Check,
  ShieldCheck,
  Users
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

  const handleSimulateAcknowledgement = async (contactId) => {
    if (!activeIncident) return;
    try {
      await api.acknowledgeSOS({
        incidentId: activeIncident._id,
        contactId,
        note: 'Simulated direct recipient mobile SMS acknowledgment'
      });
      fetchSOSState();
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
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
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', letterSpacing: '-0.02em' }}>
          <ShieldAlert size={28} color="#E02424" /> Emergency SOS Console
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          High-priority incident dispatch, emergency calling, and family coordination
        </p>
      </div>

      {/* Immediate Call 112 Action Bar */}
      <div
        className="card"
        style={{
          background: '#FDE8E8',
          border: '1px solid #F8B4B4',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#9B1C1C', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PhoneCall size={18} /> Official Emergency Calling (India ERSS 112)
            </div>
            <div style={{ fontSize: '0.82rem', color: '#771D1D', marginTop: '0.15rem' }}>
              Police • Fire • Ambulance • Disaster Relief. Accessible without GPS or internet.
            </div>
          </div>
          <div style={{ flex: '1 1 auto', minWidth: '180px', maxWidth: '320px' }}>
            <Call112Button incidentId={activeIncident?._id} emergencySummary={emergencySummary} variant="primary" />
          </div>
        </div>
      </div>

      {/* Active Incident State or Inactive Trigger Form */}
      {activeIncident ? (
        <div className="card" style={{ border: '2px solid #E02424', padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <span className="badge badge-critical" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
                SOS ACTIVE • {activeIncident.incidentNumber}
              </span>
              <h2 style={{ fontSize: '1.35rem', marginTop: '0.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                {activeIncident.category}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleResolveIncident('resolved')}
                className="btn btn-secondary btn-sm"
                style={{ background: '#DEF7EC', color: '#03543F', borderColor: '#31C48D', fontWeight: 700 }}
              >
                <CheckCircle size={15} /> Resolve Incident
              </button>
              <button onClick={() => handleResolveIncident('cancelled')} className="btn btn-secondary btn-sm">
                <XCircle size={15} /> Cancel SOS
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem', background: 'var(--bg-card-inset)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong>Dispatched Note:</strong> {activeIncident.description || 'Emergency SOS triggered.'}
          </p>

          {/* Location Details */}
          <div
            style={{
              background: 'var(--bg-card-inset)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#FF4800', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Navigation size={15} /> Dispatched Geolocation Coordinates
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
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
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Send size={16} color="#FF4800" /> Trusted Contact Dispatch Log
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activeIncident.recipients?.map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card-inset)',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{rec.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rec.phone} • {rec.channel}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <StatusBadge status={rec.status} type="notification" />
                    {rec.status !== 'acknowledged' && (
                      <button
                        onClick={() => handleSimulateAcknowledgement(rec.contactId)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', height: '28px', color: '#FF4800', borderColor: 'rgba(255, 72, 0, 0.3)' }}
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
            <div style={{ background: 'var(--bg-card-inset)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  112 Operator Dispatch Readout
                </span>
                <button onClick={copySummary} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                  {copied ? <Check size={14} color="#0E9F6E" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre style={{ fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0 }}>
                {emergencySummary}
              </pre>
            </div>
          )}
        </div>
      ) : (
        /* Inactive SOS Trigger Configuration & Button */
        <div className="card" style={{ padding: '2rem 1.75rem', marginBottom: '1.5rem' }}>
          {/* Signal Bridge Big Accessible Press-and-Hold Button */}
          <div style={{ margin: '1rem 0 2rem 0', display: 'flex', justifyContent: 'center' }}>
            <SOSButton onTrigger={handleTriggerSOS} disabled={submitting} />
          </div>

          {/* Emergency Category Selector */}
          <div className="form-group">
            <label className="form-label">Select Incident Nature</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.5rem' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: category === cat ? '#FFF5F0' : '#FFFFFF',
                    border: `1px solid ${category === cat ? '#FF4800' : 'var(--border-medium)'}`,
                    color: category === cat ? '#FF4800' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
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
              Situation Notes (Optional)
            </label>
            <textarea
              id="description"
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Inhaler needed, underpass waterlogging rising..."
            />
          </div>

          {/* Location Status Bar */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card-inset)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} color={coords ? '#0E9F6E' : '#D97706'} />
              <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                {coords
                  ? `GPS coordinates locked (±${coords.accuracy}m)`
                  : 'GPS location pending device permission'}
              </span>
            </div>
            {!coords && (
              <button onClick={requestLocation} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}>
                Acquire GPS Now
              </button>
            )}
          </div>

          {/* Contact Dispatch Selection */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              Dispatch Recipients ({selectedContacts.length} selected)
            </label>
            {contacts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {contacts.map((c) => {
                  const isChecked = selectedContacts.includes(c._id);
                  return (
                    <label
                      key={c._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isChecked ? '#FFF5F0' : '#FFFFFF',
                        border: `1px solid ${isChecked ? '#FF4800' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isChecked ? 'linear-gradient(135deg, #FF4800 0%, #FF7A00 100%)' : '#F3F4F6',
                            color: isChecked ? '#FFFFFF' : '#4B5563',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}
                        >
                          {c.name ? c.name.charAt(0) : 'C'}
                        </div>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {c.name} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({c.relationship})</span>
                        </span>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedContacts((prev) =>
                            prev.includes(c._id) ? prev.filter((id) => id !== c._id) : [...prev, c._id]
                          );
                        }}
                        style={{ width: '18px', height: '18px', accentColor: '#FF4800' }}
                      />
                    </label>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No emergency contacts registered yet. Go to the Contacts tab to add trusted family.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
