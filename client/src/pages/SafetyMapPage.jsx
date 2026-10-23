import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Filter,
  PlusCircle,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { HazardMap } from '../components/HazardMap.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';

export const SafetyMapPage = () => {
  const { coords } = useLocation();

  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');
  const [includeResolved, setIncludeResolved] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const categories = [
    'All Categories',
    'Accident',
    'Fire or Smoke',
    'Flooding or Severe Weather',
    'Blocked or Unsafe Road',
    'Violence or Public Safety',
    'Medical Emergency',
    'Other Hazard'
  ];

  const fetchHazards = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'All Categories') params.category = selectedCategory;
      if (selectedSeverity) params.severity = selectedSeverity;
      if (selectedStatus) params.status = selectedStatus;
      if (search) params.search = search;
      if (includeResolved) params.includeResolved = 'true';

      const data = await api.getHazards(params);
      if (data.success) {
        setHazards(data.hazards);
      }
    } catch (err) {
      console.warn('Error fetching hazards:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHazards();

    const socket = getSocket();
    const handleNewHazard = (data) => {
      if (data?.hazard) {
        setHazards((prev) => [data.hazard, ...prev.filter((h) => h._id !== data.hazard._id)]);
      }
    };
    const handleUpdatedHazard = (data) => {
      if (data?.hazard) {
        setHazards((prev) => prev.map((h) => (h._id === data.hazard._id ? data.hazard : h)));
      }
    };
    const handleResolvedHazard = (data) => {
      if (data?.hazardId) {
        setHazards((prev) => prev.map((h) => (h._id === data.hazardId ? { ...h, status: 'Resolved' } : h)));
      }
    };

    socket.on('hazard_new', handleNewHazard);
    socket.on('hazard_updated', handleUpdatedHazard);
    socket.on('hazard_resolved', handleResolvedHazard);

    return () => {
      socket.off('hazard_new', handleNewHazard);
      socket.off('hazard_updated', handleUpdatedHazard);
      socket.off('hazard_resolved', handleResolvedHazard);
    };
  }, [selectedCategory, selectedSeverity, selectedStatus, includeResolved]);

  const handleCorroborate = async (hazardId) => {
    setFeedbackMsg(null);
    try {
      const res = await api.corroborateHazard(hazardId, { note: 'Confirmed by nearby user on Safety Radar.' });
      setFeedbackMsg({ type: 'success', text: res.message || 'Report corroborated! Radar verified.' });
      fetchHazards();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: `Corroborate failed: ${err.message}` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header and Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            <Compass size={24} color="#FF4800" /> Safety Radar & Geospatial Intel
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            CartoDB Voyager live urban hazard surveillance with rule-based mathematical corroboration
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchHazards} className="btn btn-secondary btn-sm" title="Refresh Map Data">
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <Link to="/app/report" className="btn btn-primary btn-sm">
            <PlusCircle size={15} /> Report Hazard
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{
          background: feedbackMsg.type === 'success' ? 'var(--status-safe-bg)' : 'var(--status-danger-bg)',
          border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(14, 159, 110, 0.35)' : 'rgba(224, 36, 36, 0.35)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: feedbackMsg.type === 'success' ? 'var(--status-safe-text)' : 'var(--status-danger-text)'
        }}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Category Dropdown */}
          <div style={{ flex: '1 1 180px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            >
              {categories.map((c) => (
                <option key={c} value={c === 'All Categories' ? '' : c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Dropdown */}
          <div style={{ flex: '1 1 140px' }}>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div style={{ flex: '1 1 150px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            >
              <option value="">Active Verification</option>
              <option value="Corroborated Hazard">Corroborated</option>
              <option value="Multiple Reports">Multiple Reports</option>
              <option value="Unverified Report">Unverified</option>
              <option value="Official Alert">Official Alerts</option>
            </select>
          </div>

          {/* Search text */}
          <div style={{ flex: '2 1 200px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search description or street..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchHazards()}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem 0.5rem 2.2rem' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeResolved}
              onChange={(e) => setIncludeResolved(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#FF4800' }}
            />
            <span>Show Resolved</span>
          </label>
        </div>
      </div>

      {/* Interactive Map Component */}
      <div className="card" style={{ padding: '0.5rem', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <HazardMap
          hazards={hazards}
          userLocation={coords}
          center={coords?.lat && coords?.lng ? [coords.lat, coords.lng] : [12.9716, 77.5946]}
          zoom={coords?.lat && coords?.lng ? 15 : 13}
          onCorroborate={handleCorroborate}
          onSelectHazard={(h) => setSelectedHazard(h)}
          height="480px"
        />
        <div style={{ padding: '0.65rem 0.85rem', fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>
            📍 <strong>{hazards.length}</strong> active hazards plotted on CartoDB Voyager.
          </span>
          <span>
            Pin Colors: <strong style={{ color: '#EF4444' }}>● Critical</strong> <strong style={{ color: '#F97316' }}>● High</strong> <strong style={{ color: '#F59E0B' }}>● Medium</strong> <strong style={{ color: '#FF4800' }}>● Position</strong>
          </span>
        </div>
      </div>

      {/* Detailed Hazard List */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Active Hazard Telemetry Ledger ({hazards.length})
          </h2>
        </div>

        {hazards.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {hazards.map((h) => (
              <div
                key={h._id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card-inset)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginRight: '0.5rem' }}>
                      {h.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Reported {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <StatusBadge status={h.severity} type="severity" />
                    <StatusBadge status={h.status} type="hazard" />
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {h.description}
                </p>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  📍 {h.location?.address || `${h.location?.lat?.toFixed(4)}, ${h.location?.lng?.toFixed(4)}`}
                </div>

                {/* Transparent Verification Reason */}
                <div style={{
                  background: '#FFF5F0',
                  border: '1px solid rgba(255, 72, 0, 0.22)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.78rem',
                  color: '#9A2C00',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Info size={14} color="#FF4800" />
                  <span><strong>Verification Rule:</strong> {h.verificationReason}</span>
                </div>

                {/* Bottom action row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {h.status !== 'Resolved' && (
                    <button
                      onClick={() => handleCorroborate(h._id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', color: '#FF4800', borderColor: 'rgba(255, 72, 0, 0.35)' }}
                    >
                      <ShieldCheck size={14} color="#FF4800" />
                      <span>Corroborate (+1 Confirm)</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            No hazards match the active filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
