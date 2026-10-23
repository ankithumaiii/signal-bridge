import React, { useState, useEffect } from 'react';
import {
  History,
  AlertCircle,
  MapPin,
  CheckCircle,
  Clock,
  ShieldAlert,
  Send,
  Navigation,
  Check,
  XCircle,
  Trash2
} from 'lucide-react';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.jsx';

export const HistoryPage = () => {
  const [tab, setTab] = useState('sos'); // 'sos' | 'hazards'
  const [incidents, setIncidents] = useState([]);
  const [myHazards, setMyHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [sosRes, hazardRes] = await Promise.all([
        api.getSOSHistory(),
        api.getMyHazards()
      ]);

      if (sosRes.success) setIncidents(sosRes.incidents);
      if (hazardRes.success) setMyHazards(hazardRes.hazards);
    } catch (err) {
      console.warn('Error fetching history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleResolveHazard = async (id) => {
    const confirm = window.confirm('Mark this hazard report as resolved?');
    if (!confirm) return;

    try {
      await api.resolveHazard(id, { note: 'Resolved by author via history tab.' });
      fetchHistory();
      setSelectedItem(null);
    } catch (err) {
      alert(`Resolve failed: ${err.message}`);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-accent-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent)'
          }}>
            <History size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Audit Ledger & Activity History
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Immutable transaction records of emergency dispatches, hazard submissions, and carrier telemetry
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.45rem 0.9rem' }}
        >
          <Clock size={14} /> {loading ? 'Refreshing...' : 'Refresh Records'}
        </button>
      </div>

      {/* Signal Bridge Filter / Segment Pills */}
      <div style={{
        display: 'inline-flex',
        padding: '0.35rem',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <button
          onClick={() => setTab('sos')}
          style={{
            padding: '0.45rem 1.1rem',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: tab === 'sos' ? 'var(--color-accent)' : 'transparent',
            color: tab === 'sos' ? '#FFFFFF' : 'var(--text-secondary)',
            transition: 'var(--transition-fast)'
          }}
        >
          <AlertCircle size={15} /> Emergency Dispatches ({incidents.length})
        </button>
        <button
          onClick={() => setTab('hazards')}
          style={{
            padding: '0.45rem 1.1rem',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: tab === 'hazards' ? 'var(--color-accent)' : 'transparent',
            color: tab === 'hazards' ? '#FFFFFF' : 'var(--text-secondary)',
            transition: 'var(--transition-fast)'
          }}
        >
          <MapPin size={15} /> Community Hazard Submissions ({myHazards.length})
        </button>
      </div>

      {/* SOS Tab */}
      {tab === 'sos' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Emergency SOS Dispatch Ledger
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Logged triggers, location fixes, and verified carrier SMS dispatch statuses
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              Loading audit records...
            </div>
          ) : incidents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {incidents.map((inc) => (
                <div
                  key={inc._id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-accent)', fontFamily: 'monospace' }}>
                          #{inc.incidentNumber}
                        </span>
                        <span className="badge badge-critical" style={{ fontSize: '0.75rem' }}>
                          {inc.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Triggered on {new Date(inc.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <StatusBadge status={inc.status} type="notification" />
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {inc.description}
                  </p>

                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'var(--bg-card)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    width: 'fit-content'
                  }}>
                    <MapPin size={13} color="var(--color-accent)" />
                    <span>Coordinates: {inc.location?.lat ? `${inc.location.lat.toFixed(5)}, ${inc.location.lng.toFixed(5)} (±${inc.location.accuracy || '?'}m)` : 'GPS unavailable'}</span>
                  </div>

                  {/* Recipient Outcomes */}
                  {inc.recipients?.length > 0 && (
                    <div style={{
                      background: 'var(--bg-card)',
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        DISPATCH OUTCOMES & RECIPIENT LOGS:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {inc.recipients.map((r, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.35rem 0.5rem', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({r.phone})</span></span>
                            <StatusBadge status={r.status} type="notification" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Call 112 Action Audit */}
                  {inc.emergencyServicesAction?.called112 && (
                    <div style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-danger)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontWeight: 600
                    }}>
                      <CheckCircle size={15} /> Official 112 phone dialer was launched on user hardware.
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={40} color="var(--border-subtle)" style={{ marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>No emergency incidents on record</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>When you trigger an emergency SOS, the complete audit payload and delivery breakdown will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Hazard Submissions Tab */}
      {tab === 'hazards' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Your Community Hazard Submissions
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Audited reports contributed by you to the decentralized safety mesh
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              Loading hazard submissions...
            </div>
          ) : myHazards.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myHazards.map((h) => (
                <div
                  key={h._id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {h.category}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Submitted on {new Date(h.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                      <StatusBadge status={h.severity} type="severity" />
                      <StatusBadge status={h.status} type="hazard" />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {h.description}
                  </p>

                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'var(--bg-card)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    width: 'fit-content'
                  }}>
                    <MapPin size={13} color="var(--color-accent)" />
                    <span>Location: {h.location?.address || 'Pinned map point'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Peer Corroborations: <strong style={{ color: 'var(--color-accent)' }}>{h.corroborationCount || 1}</strong>
                    </span>

                    {h.status !== 'Resolved' && (
                      <button
                        onClick={() => handleResolveHazard(h._id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', fontWeight: 600 }}
                      >
                        <CheckCircle size={14} color="var(--color-success)" /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <MapPin size={40} color="var(--border-subtle)" style={{ marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>No hazard submissions yet</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Reports you submit on the Safety Map will appear here with peer validation and resolution controls.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
