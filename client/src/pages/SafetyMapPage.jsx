import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Filter,
  PlusCircle,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Navigation,
  ShieldCheck,
  Info
} from 'lucide-react';
import { HazardMap } from '../components/HazardMap.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';

export const SafetyMapPage = () => {
  const { coords, requestLocation } = useLocation();

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
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All Categories') params.append('category', selectedCategory);
      if (selectedSeverity) params.append('severity', selectedSeverity);
      if (selectedStatus) params.append('status', selectedStatus);
      if (search) params.append('search', search);
      if (includeResolved) params.append('includeResolved', 'true');

      const data = await api.getHazards(params.toString());
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

    // Listen to real-time hazard broadcasts over Socket.IO
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
      setFeedbackMsg(res.message);
      fetchHazards();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      setFeedbackMsg(`Corroborate failed: ${err.message}`);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header and Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={24} color="var(--brand-blue)" /> Safety Radar Map
          </h1>
          <p style={{ fontSize: '0.875rem' }}>
            Real-time urban hazard surveillance with rule-based transparent verification
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchHazards} className="btn btn-secondary btn-sm" title="Refresh Map Data">
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <Link to="/app/report" className="btn btn-primary btn-sm">
            <PlusCircle size={16} /> Report Hazard
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{
          background: 'rgba(58, 134, 255, 0.15)',
          border: '1px solid rgba(58, 134, 255, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          color: '#93C5FD'
        }}>
          {feedbackMsg}
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

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeResolved}
              onChange={(e) => setIncludeResolved(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
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
          center={[12.9716, 77.5946]} // Default Bangalore tech cluster demo
          zoom={13}
          onCorroborate={handleCorroborate}
          onSelectHazard={(h) => setSelectedHazard(h)}
          height="480px"
        />
        <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>
            📍 <strong>{hazards.length}</strong> hazards displayed. Standard OpenStreetMap tiles require connectivity; cached coordinates stay visible offline.
          </span>
          <span>
            Pin Colors: <strong style={{ color: '#E63946' }}>● Critical</strong> <strong style={{ color: '#F97316' }}>● High</strong> <strong style={{ color: '#EAB308' }}>● Medium</strong> <strong style={{ color: '#3B82F6' }}>● Low</strong>
          </span>
        </div>
      </div>

      {/* Detailed Hazard List */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1.15rem' }}>
            Detailed Hazard Reports ({hazards.length})
          </h2>
        </div>

        {hazards.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {hazards.map((h) => (
              <div
                key={h._id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', marginRight: '0.5rem' }}>
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

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {h.description}
                </p>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  📍 {h.location?.address || `${h.location?.lat?.toFixed(4)}, ${h.location?.lng?.toFixed(4)}`}
                </div>

                {/* Transparent Verification Reason */}
                <div style={{
                  background: 'rgba(58, 134, 255, 0.08)',
                  border: '1px solid rgba(58, 134, 255, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.78rem',
                  color: '#93C5FD',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Info size={14} />
                  <span><strong>Verification Rule:</strong> {h.verificationReason}</span>
                </div>

                {/* Bottom action row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {h.status !== 'Resolved' && (
                    <button
                      onClick={() => handleCorroborate(h._id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      <ShieldCheck size={14} color="var(--color-success)" />
                      <span>Corroborate ({h.corroborationCount || 1})</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            No hazards match the active filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
