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
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={24} color="var(--brand-blue)" /> Incident & Audit History
        </h1>
        <p style={{ fontSize: '0.875rem' }}>
          Persistent records of your emergency alerts, hazard submissions, and recipient acknowledgements
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setTab('sos')}
          className={`btn ${tab === 'sos' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <AlertCircle size={15} /> Emergency SOS Incidents ({incidents.length})
        </button>
        <button
          onClick={() => setTab('hazards')}
          className={`btn ${tab === 'hazards' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <MapPin size={15} /> Community Hazard Submissions ({myHazards.length})
        </button>
      </div>

      {/* SOS Tab */}
      {tab === 'sos' && (
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1.15rem' }}>Emergency SOS History</h2>
          </div>

          {incidents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {incidents.map((inc) => (
                <div
                  key={inc._id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF' }}>
                          {inc.incidentNumber}
                        </span>
                        <span className="badge badge-critical" style={{ fontSize: '0.75rem' }}>
                          {inc.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Triggered on {new Date(inc.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <StatusBadge status={inc.status} type="notification" />
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {inc.description}
                  </p>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    📍 Location: {inc.location?.lat ? `${inc.location.lat.toFixed(5)}, ${inc.location.lng.toFixed(5)} (±${inc.location.accuracy || '?'}m)` : 'GPS unavailable'}
                  </div>

                  {/* Recipient Outcomes */}
                  {inc.recipients?.length > 0 && (
                    <div style={{ background: 'rgba(11, 19, 43, 0.6)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                        DISPATCH OUTCOMES:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {inc.recipients.map((r, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span>{r.name} ({r.phone})</span>
                            <StatusBadge status={r.status} type="notification" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Call 112 Action Audit */}
                  {inc.emergencyServicesAction?.called112 && (
                    <div style={{ fontSize: '0.8rem', color: '#FF6B6B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle size={14} /> Official 112 phone dialer was initiated by user.
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No emergency incidents on record.
            </div>
          )}
        </div>
      )}

      {/* Hazard Submissions Tab */}
      {tab === 'hazards' && (
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1.15rem' }}>Your Community Hazard Submissions</h2>
          </div>

          {myHazards.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myHazards.map((h) => (
                <div
                  key={h._id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF' }}>
                        {h.category}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Submitted on {new Date(h.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <StatusBadge status={h.severity} type="severity" />
                      <StatusBadge status={h.status} type="hazard" />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {h.description}
                  </p>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    📍 {h.location?.address || 'Pinned point'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--brand-blue)' }}>
                      Corroborations: <strong>{h.corroborationCount || 1}</strong>
                    </span>

                    {h.status !== 'Resolved' && (
                      <button
                        onClick={() => handleResolveHazard(h._id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                      >
                        <CheckCircle size={14} color="var(--color-success)" /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              You have not submitted any hazard reports yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
