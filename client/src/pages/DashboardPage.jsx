import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  PhoneCall,
  MapPin,
  Users,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Navigation,
  Radio,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useOffline } from '../context/OfflineContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { api } from '../services/api.js';
import { Call112Button } from '../components/Call112Button.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { isOnline, demoMode } = useOffline();
  const { coords, status: locationStatus, requestLocation } = useLocation();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInSending, setCheckInSending] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const data = await api.getDashboardStats();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Quick check-in action
  const handleQuickCheckIn = async (statusType) => {
    setCheckInSending(true);
    setCheckInMsg(null);
    try {
      const message = statusType === 'safe'
        ? `${user?.name || 'User'} checked in: All Safe & Secure.`
        : `${user?.name || 'User'} sent urgent check-in: Immediate assistance requested.`;

      await api.sendCheckIn({
        status: statusType,
        message,
        location: coords
      });

      setCheckInMsg(statusType === 'safe' ? "Status shared: You are marked SAFE to contacts." : "Alert sent: Family informed you need help.");
      fetchDashboardData();
      setTimeout(() => setCheckInMsg(null), 4000);
    } catch (err) {
      setCheckInMsg(`Failed: ${err.message}`);
    } finally {
      setCheckInSending(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Top Banner Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Safety Center</h1>
          <p style={{ fontSize: '0.875rem' }}>
            Welcome back, <strong>{user?.name}</strong>. Radar monitoring active.
          </p>
        </div>

        {/* GPS Location Tracker Chip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          background: coords ? 'rgba(58, 134, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-medium)',
          fontSize: '0.8rem'
        }}>
          <Navigation size={14} color={coords ? 'var(--brand-blue)' : 'var(--text-muted)'} />
          <span>
            {coords
              ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} (±${coords.accuracy}m)`
              : 'GPS: Not Acquired'}
          </span>
          {!coords && (
            <button
              onClick={requestLocation}
              style={{
                background: 'var(--brand-blue)',
                color: '#fff',
                borderRadius: 'var(--radius-full)',
                padding: '0.15rem 0.5rem',
                fontSize: '0.7rem',
                fontWeight: 600
              }}
            >
              Locate
            </button>
          )}
        </div>
      </div>

      {/* Emergency Active Banner (if user has active SOS) */}
      {stats?.activeSOS && (
        <div style={{
          background: 'rgba(230, 57, 70, 0.2)',
          border: '2px solid var(--sos-red)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sos)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--sos-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={24} color="#FFFFFF" className="animate-pulse-red" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#FF6B6B', fontSize: '1.1rem' }}>
                ACTIVE EMERGENCY SOS: {stats.activeSOS.incidentNumber}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#FEE2E2' }}>
                Category: <strong>{stats.activeSOS.category}</strong> — {stats.activeSOS.description}
              </div>
            </div>
          </div>
          <Link to="/app/sos" className="btn btn-sos">
            Manage Active Incident <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Primary Emergency Action Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(28, 37, 65, 0.95) 0%, rgba(39, 53, 89, 0.95) 100%)',
        border: '1px solid rgba(230, 57, 70, 0.3)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFFFFF' }}>
              <AlertTriangle size={22} color="var(--sos-red)" /> Emergency SOS Center
            </h2>
            <p style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>
              Instantly transmit verified alert with GPS coordinates to trusted contacts and open Call 112.
            </p>
          </div>
          <Link to="/app/sos" className="btn btn-sos btn-lg">
            <AlertCircle size={20} /> Open Emergency SOS
          </Link>
        </div>

        {/* Call 112 Bar */}
        <div style={{
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PhoneCall size={18} color="#FF6B6B" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Official India Emergency Number: <strong>112</strong></span>
          </div>
          <div style={{ maxWidth: '380px', width: '100%' }}>
            <Call112Button
              incidentId={stats?.activeSOS?._id}
              emergencySummary={`[SIGNAL BRIDGE READOUT]\nUser: ${user?.name}\nMedical: ${user?.medicalNotes || 'None'}\nGPS: ${coords ? `${coords.lat}, ${coords.lng}` : 'Unavailable'}`}
              variant="secondary"
            />
          </div>
        </div>
      </div>

      {/* Quick Family Check-in Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={16} color="var(--brand-blue)" /> Rapid Family Check-In
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Broadcast immediate safety status to your emergency circle
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleQuickCheckIn('safe')}
              disabled={checkInSending}
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34D399' }}
            >
              <CheckCircle2 size={15} /> I'm Safe
            </button>
            <button
              onClick={() => handleQuickCheckIn('need_help')}
              disabled={checkInSending}
              className="btn btn-outline-danger btn-sm"
            >
              <AlertTriangle size={15} /> I Need Help
            </button>
          </div>
        </div>

        {checkInMsg && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#6EE7B7', fontWeight: 600 }}>
            {checkInMsg}
          </div>
        )}
      </div>

      {/* Grid: 3 Metric Cards */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        {/* Hazards Metric */}
        <Link to="/app/map" className="card" style={{ textDecoration: 'none' }}>
          <div className="card-header">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>LOCAL HAZARDS</span>
            <MapPin size={18} color="var(--brand-blue)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.25rem' }}>
            {stats?.hazards?.activeNearby ?? 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Active reports on Safety Radar
          </div>
        </Link>

        {/* Contacts Metric */}
        <Link to="/app/family" className="card" style={{ textDecoration: 'none' }}>
          <div className="card-header">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TRUSTED CONTACTS</span>
            <Users size={18} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.25rem' }}>
            {stats?.contacts?.emergencyReady ?? 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {stats?.contacts?.total ?? 0}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Configured for instant SOS dispatch
          </div>
        </Link>

        {/* System Health */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>SYSTEM STATUS</span>
            <Radio size={18} color="var(--color-info)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isOnline ? 'var(--color-success)' : 'var(--color-danger)' }}></div>
            <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              {isOnline ? 'Online Engine' : 'Offline Queue'}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {demoMode ? 'Demo Mode Active (Simulated notifications)' : 'Standard Monitoring'}
          </div>
        </div>
      </div>

      {/* Grid 2: Recent Hazards & Recent Family Messages */}
      <div className="grid-2">
        {/* Recent Hazards List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <MapPin size={18} color="var(--brand-blue)" /> Nearby Hazard Radar
            </h3>
            <Link to="/app/map" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              View Map
            </Link>
          </div>

          {stats?.hazards?.recent?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.hazards.recent.map((h) => (
                <div
                  key={h._id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF' }}>{h.category}</span>
                    <StatusBadge status={h.status} type="hazard" />
                  </div>
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>{h.description}</p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    📍 {h.location?.address || 'Pinned Location'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <p>No nearby hazards reported right now.</p>
              <Link to="/app/report" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                <PlusCircle size={14} /> Report Hazard
              </Link>
            </div>
          )}
        </div>

        {/* Recent Messages & Family Circle */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <MessageSquare size={18} color="var(--color-success)" /> Family Circle Messages
            </h3>
            <Link to="/app/messages" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Open Chat
            </Link>
          </div>

          {stats?.recentMessages?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recentMessages.map((m) => (
                <div
                  key={m._id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--brand-blue)' }}>
                      {m.senderId?.name || 'Member'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>{m.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <p>No recent messages in your family circle.</p>
              <Link to="/app/messages" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                Start Conversation
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
