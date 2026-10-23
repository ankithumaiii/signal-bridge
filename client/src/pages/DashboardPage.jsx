import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, PhoneCall, MapPin, Users, MessageSquare,
  ShieldCheck, CheckCircle2, ArrowRight, PlusCircle, Navigation,
  Clock, Activity, Wifi, WifiOff, AlertCircle, Compass,
  Phone, Radio, Send, ExternalLink, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useOffline } from '../context/OfflineContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { HazardMap } from '../components/HazardMap.jsx';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { isOnline, demoMode, queueCount, flushQueue, isFlushing } = useOffline();
  const { coords, status: locationStatus, requestLocation } = useLocation();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [hazards, setHazards] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [checkInSending, setCheckInSending] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [corroboratingId, setCorroboratingId] = useState(null);

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [statsData, hazardsData, contactsData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getHazards({ limit: 12 }).catch(() => null),
        api.getContacts().catch(() => null)
      ]);

      if (statsData?.success) setStats(statsData.stats);
      if (hazardsData?.success) setHazards(hazardsData.hazards || []);
      if (contactsData?.success) setContacts(contactsData.contacts || []);
    } catch (err) {
      console.warn('Dashboard fetch notice:', err.message);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickCheckIn = async (statusType) => {
    setCheckInSending(true);
    setActionNotice(null);
    try {
      const isSafe = statusType === 'safe';
      const message = isSafe
        ? `${user?.name || 'User'} checked in: All safe and secure.`
        : `${user?.name || 'User'} broadcasted an urgent alert: Immediate assistance requested.`;

      await api.sendCheckIn({
        status: isSafe ? 'safe' : 'need_help',
        message,
        location: coords ? { lat: coords.lat, lng: coords.lng } : undefined
      });

      setActionNotice({
        type: 'success',
        text: isSafe
          ? '✓ "Safe" ping broadcast to your emergency circle with location telemetry.'
          : '⚠ Assistance broadcast dispatched to your trusted contacts circle.'
      });
      fetchDashboardData();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: err.message || 'Check-in dispatch failed. Action queued locally in offline outbox.'
      });
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setCheckInSending(false);
    }
  };

  const handleCorroborate = async (hazardId) => {
    setCorroboratingId(hazardId);
    setActionNotice(null);
    try {
      const res = await api.corroborateHazard(hazardId, { notes: 'Corroborated via Overview dashboard.' });
      setActionNotice({
        type: 'success',
        text: res.message || 'Report corroborated and trust score updated.'
      });
      fetchDashboardData();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message || 'Could not corroborate report.' });
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setCorroboratingId(null);
    }
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const totalContactsCount = contacts.length || stats?.contacts?.total || 0;
  const activeHazardsCount = hazards.length || stats?.hazards?.activeNearby || 0;

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

      {/* — Feedback Banner — */}
      {actionNotice && (
        <div style={{
          background: actionNotice.type === 'success' ? 'var(--color-safe-bg)' : 'var(--color-emergency-bg)',
          color: actionNotice.type === 'success' ? 'var(--color-safe-text)' : 'var(--color-emergency-text)',
          border: `1px solid ${actionNotice.type === 'success' ? 'rgba(46, 125, 91, 0.25)' : 'rgba(192, 57, 43, 0.25)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 550,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {actionNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '0.8rem',
              opacity: 0.7
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         1. EDITORIAL HEADER & DATE/TELEMETRY META
         ═══════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        paddingBottom: 'var(--space-2)'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--color-ink-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.35rem'
          }}>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Compass size={12} color="var(--color-accent)" />
              {coords ? `${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E` : 'Bengaluru, KA'}
            </span>
          </div>

          <h1 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 'clamp(1.65rem, 3.2vw, 2.25rem)',
            fontWeight: 700,
            color: 'var(--color-ink)',
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            margin: 0
          }}>
            Hello, {firstName}
          </h1>
          <p style={{
            fontSize: '0.92rem',
            color: 'var(--color-ink-secondary)',
            marginTop: '0.25rem',
            marginBottom: 0
          }}>
            All emergency monitors and trusted responder circles are active.
          </p>
        </div>

        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="btn btn-sm btn-secondary"
          style={{ gap: '0.35rem', alignSelf: 'flex-start' }}
          title="Refresh real-time data"
        >
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          <span>{refreshing ? 'Updating…' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         2. EMERGENCY READINESS & SOS COMMAND BAR
         ═══════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-6)',
        boxShadow: 'var(--shadow-xs)'
      }}>
        {/* Left: System Readiness & Live Telemetry Pills */}
        <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--color-safe)',
              boxShadow: '0 0 0 3px rgba(46, 125, 91, 0.2)'
            }} />
            <span style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--color-ink)',
              letterSpacing: '-0.02em'
            }}>
              Emergency System Operational
            </span>
          </div>

          <p style={{
            fontSize: '0.84rem',
            color: 'var(--color-ink-secondary)',
            margin: 0,
            lineHeight: 1.45
          }}>
            Continuous background telemetry linked. In any crisis, triggering SOS instantly coordinates with your emergency circle and ERSS emergency lines.
          </p>

          {/* Micro Telemetry Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            flexWrap: 'wrap',
            paddingTop: '0.25rem'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.55rem',
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.74rem',
              fontWeight: 550,
              color: 'var(--color-ink)'
            }}>
              <Users size={12} color="var(--color-accent)" />
              <span>{totalContactsCount} Trusted Contacts</span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.55rem',
              background: isOnline ? 'var(--color-safe-bg)' : 'var(--color-warning-bg)',
              border: `1px solid ${isOnline ? 'rgba(46, 125, 91, 0.25)' : 'rgba(184, 134, 11, 0.25)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.74rem',
              fontWeight: 550,
              color: isOnline ? 'var(--color-safe-text)' : 'var(--color-warning-text)'
            }}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOnline ? 'Carrier & Mesh Online' : 'Store & Forward Buffer'}</span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.55rem',
              background: coords ? 'var(--color-safe-bg)' : 'var(--color-surface-alt)',
              border: `1px solid ${coords ? 'rgba(46, 125, 91, 0.25)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.74rem',
              fontWeight: 550,
              color: coords ? 'var(--color-safe-text)' : 'var(--color-ink-muted)'
            }}>
              <Navigation size={12} />
              <span>{coords ? 'GPS Lock (±10m)' : 'GPS Standby'}</span>
            </div>

            {queueCount > 0 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.55rem',
                background: 'var(--color-warning-bg)',
                border: '1px solid rgba(184, 134, 11, 0.25)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: 'var(--color-warning-text)'
              }}>
                <Activity size={12} />
                <span>{queueCount} Outbox Pending</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Unmistakable Primary Emergency SOS Trigger */}
        <div style={{ flex: '0 0 auto' }}>
          <Link
            to="/app/sos"
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.85rem 1.75rem',
              background: 'var(--color-emergency)',
              color: 'var(--color-ink-inverse)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(192, 57, 43, 0.35)',
              transition: 'all 0.15s ease',
              minWidth: '220px',
              textAlign: 'center'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-emergency-hover)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--color-emergency)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            aria-label="Trigger Emergency SOS"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
              <AlertCircle size={20} />
              <span>EMERGENCY SOS</span>
            </div>
            <span style={{ fontSize: '0.72rem', opacity: 0.9, fontWeight: 500, marginTop: '0.15rem' }}>
              Broadcast to circle & dispatch 112
            </span>
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         3. QUICK SAFETY ACTIONS RIBBON
         ═══════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => handleQuickCheckIn('safe')}
          disabled={checkInSending}
          className="btn btn-sm"
          style={{
            background: 'var(--color-safe-bg)',
            color: 'var(--color-safe-text)',
            border: '1px solid rgba(46, 125, 91, 0.3)',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={15} />
          <span>I'm Safe</span>
        </button>

        <button
          onClick={() => handleQuickCheckIn('need_help')}
          disabled={checkInSending}
          className="btn btn-sm btn-outline-danger"
          style={{ fontWeight: 600 }}
        >
          <AlertTriangle size={15} />
          <span>Need Assistance</span>
        </button>

        <Link to="/app/report" className="btn btn-sm btn-secondary" style={{ fontWeight: 500 }}>
          <PlusCircle size={15} />
          <span>Report Hazard</span>
        </Link>

        <a
          href="tel:112"
          className="btn btn-sm"
          style={{
            background: 'var(--color-emergency-bg)',
            color: 'var(--color-emergency)',
            border: '1px solid rgba(192, 57, 43, 0.25)',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          <PhoneCall size={14} />
          <span>Call 112 (ERSS)</span>
        </a>

        {!coords && (
          <button
            onClick={requestLocation}
            className="btn btn-sm btn-secondary"
            style={{ fontWeight: 500 }}
          >
            <Navigation size={14} />
            <span>Enable GPS Lock</span>
          </button>
        )}

        {queueCount > 0 && isOnline && (
          <button
            onClick={flushQueue}
            disabled={isFlushing}
            className="btn btn-sm btn-secondary"
            style={{ fontWeight: 600, color: 'var(--color-accent)' }}
          >
            <Activity size={14} />
            <span>Sync Outbox ({queueCount})</span>
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
         4. GEOSPATIAL RADAR & NEARBY HAZARD MAP
         ═══════════════════════════════════════════════════════════ */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 'var(--space-3)',
          flexWrap: 'wrap',
          gap: 'var(--space-2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '1.18rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              Nearby Hazard Radar
            </h2>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--color-ink-muted)',
              background: 'var(--color-surface-alt)',
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-full)'
            }}>
              {activeHazardsCount} active in radius
            </span>
          </div>

          <Link
            to="/app/map"
            style={{
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--color-ink-secondary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            Open Interactive Map <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)'
        }}>
          <HazardMap
            hazards={hazards}
            userLocation={coords}
            center={coords?.lat && coords?.lng ? [coords.lat, coords.lng] : [12.9716, 77.5946]}
            zoom={coords?.lat && coords?.lng ? 15 : 13}
            height="380px"
            onCorroborate={handleCorroborate}
          />
        </div>

        {/* Minimal Map Legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-5)',
          marginTop: 'var(--space-3)',
          fontSize: '0.76rem',
          color: 'var(--color-ink-muted)',
          flexWrap: 'wrap'
        }}>
          {[
            { color: '#C0392B', label: 'Critical' },
            { color: '#E67E22', label: 'High' },
            { color: '#D4AC0D', label: 'Medium' }
          ].map(item => (
            <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
              <span>{item.label}</span>
            </span>
          ))}

          {coords && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--color-accent)',
                boxShadow: '0 0 6px var(--color-accent)'
              }} />
              <span>Your Active GPS Fix</span>
            </span>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         5. TWO-COLUMN HIGH INFORMATION DENSITY GRID
         Left: Trusted Emergency Circle & Family Check-Ins
         Right: Community Hazards & System Telemetry
         ═══════════════════════════════════════════════════════════ */}
      <div className="grid-2" style={{ alignItems: 'start', gap: 'var(--space-8)' }}>

        {/* — LEFT COLUMN: Emergency Circle & Comms — */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {/* Section: Emergency Circle Contacts */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 'var(--space-3)',
              paddingBottom: 'var(--space-2)',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div>
                <h2 style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  margin: 0
                }}>
                  Emergency Circle
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                  Verified responders notified upon SOS activation
                </span>
              </div>
              <Link
                to="/app/family"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  textDecoration: 'none'
                }}
              >
                Manage ({totalContactsCount}) <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {contacts && contacts.length > 0 ? (
                contacts.slice(0, 4).map((contact, i) => (
                  <div
                    key={contact._id || i}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-3)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-surface-alt)',
                        color: 'var(--color-ink)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        flexShrink: 0,
                        border: '1px solid var(--color-border)'
                      }}>
                        {contact.name ? contact.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {contact.name}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 500,
                            color: 'var(--color-ink-muted)',
                            background: 'var(--color-surface-alt)',
                            padding: '0.1rem 0.35rem',
                            borderRadius: 'var(--radius-xs)'
                          }}>
                            {contact.relationship || 'Contact'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)', marginTop: '0.1rem' }}>
                          {contact.phone || 'No phone recorded'} • {contact.notifyInEmergency ? 'SMS Dispatch Ready' : 'Standby'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface-alt)',
                            color: 'var(--color-ink-secondary)',
                            textDecoration: 'none'
                          }}
                          title={`Call ${contact.name}`}
                        >
                          <Phone size={13} />
                        </a>
                      )}
                      <Link
                        to="/app/messages"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-surface-alt)',
                          color: 'var(--color-ink-secondary)',
                          textDecoration: 'none'
                        }}
                        title="Open Direct Chat"
                      >
                        <MessageSquare size={13} />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: 'var(--space-6) var(--space-4)',
                  textAlign: 'center',
                  background: 'var(--color-surface)',
                  border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <Users size={24} style={{ opacity: 0.3, margin: '0 auto 0.4rem auto' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink)' }}>No trusted contacts added yet</div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '0.15rem', marginBottom: '0.6rem' }}>
                    Add trusted family or neighbors who receive your emergency telemetry.
                  </p>
                  <Link to="/app/family" className="btn btn-sm btn-secondary">
                    + Add Trusted Contact
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Section: Recent Circle Messages / Check-Ins */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 'var(--space-3)',
              paddingBottom: 'var(--space-2)',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div>
                <h2 style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  margin: 0
                }}>
                  Circle Check-Ins
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                  Latest safety updates from your network
                </span>
              </div>
              <Link
                to="/app/messages"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  textDecoration: 'none'
                }}
              >
                Chat Comms <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {stats?.recentMessages && stats.recentMessages.length > 0 ? (
                stats.recentMessages.slice(0, 3).map((msg, i) => (
                  <div
                    key={msg._id || i}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--space-3)'
                    }}
                  >
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-surface-alt)',
                      color: 'var(--color-ink-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      flexShrink: 0
                    }}>
                      {msg.senderId?.name ? msg.senderId.name.charAt(0).toUpperCase() : (msg.senderName ? msg.senderName.charAt(0) : 'F')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-ink)' }}>
                          {msg.senderId?.name || msg.senderName || 'Family Member'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)' }}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.81rem', color: 'var(--color-ink-secondary)', margin: 0, lineHeight: 1.4 }}>
                        {msg.content || msg.text}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: 'var(--space-5) var(--space-4)',
                  textAlign: 'center',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', margin: 0 }}>
                    No check-in pings in circle outbox.
                  </p>
                  <button
                    onClick={() => handleQuickCheckIn('safe')}
                    className="btn btn-sm btn-secondary"
                    style={{ marginTop: '0.5rem' }}
                  >
                    Send "I'm Safe" Ping Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* — RIGHT COLUMN: Verified Incidents & Telemetry — */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {/* Section: Recent Community Reports */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 'var(--space-3)',
              paddingBottom: 'var(--space-2)',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div>
                <h2 style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  margin: 0
                }}>
                  Community Hazard Ledger
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                  Peer-corroborated safety reports
                </span>
              </div>
              <Link
                to="/app/history"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  textDecoration: 'none'
                }}
              >
                All Reports <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {hazards && hazards.length > 0 ? (
                hazards.slice(0, 4).map((hazard, i) => (
                  <div
                    key={hazard._id || i}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-3)'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-ink)' }}>
                          {hazard.category}
                        </span>
                        <StatusBadge status={hazard.severity || 'Medium'} type="severity" />
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-ink-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.35
                      }}>
                        {hazard.description}
                      </div>
                      <div style={{
                        fontSize: '0.72rem',
                        color: 'var(--color-ink-muted)',
                        marginTop: '0.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <MapPin size={11} color="var(--color-accent)" />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {hazard.location?.address || 'Bengaluru Local Area'}
                        </span>
                      </div>
                    </div>

                    {hazard.status !== 'Resolved' && (
                      <button
                        onClick={() => handleCorroborate(hazard._id)}
                        disabled={corroboratingId === hazard._id}
                        className="btn btn-sm btn-secondary"
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: 'var(--color-accent)',
                          borderColor: 'rgba(197, 107, 69, 0.3)',
                          flexShrink: 0
                        }}
                        title="Corroborate report authenticity"
                      >
                        {corroboratingId === hazard._id ? 'Verifying…' : `Verify (${hazard.corroborationCount || 1})`}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div style={{
                  padding: 'var(--space-6) var(--space-4)',
                  textAlign: 'center',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <CheckCircle2 size={24} style={{ color: 'var(--color-safe)', margin: '0 auto 0.4rem auto' }} />
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', margin: 0 }}>
                    No active critical hazards reported nearby.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Infrastructure & Dispatch Diagnostics */}
          <div style={{
            padding: 'var(--space-4) var(--space-5)',
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}>
            <div style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-ink-muted)'
            }}>
              Dispatch Architecture Status
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 'var(--space-2)',
              fontSize: '0.78rem',
              color: 'var(--color-ink-secondary)'
            }}>
              <div>
                <span style={{ color: 'var(--color-ink-muted)' }}>Emergency ERSS:</span>{' '}
                <strong style={{ color: 'var(--color-ink)' }}>112 Dial Link Ready</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-ink-muted)' }}>Mesh Protocol:</span>{' '}
                <strong style={{ color: 'var(--color-ink)' }}>WebSocket Active</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-ink-muted)' }}>Offline Vault:</span>{' '}
                <strong style={{ color: 'var(--color-ink)' }}>IndexedDB Store</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-ink-muted)' }}>SMS Dispatch:</span>{' '}
                <strong style={{ color: 'var(--color-ink)' }}>Carrier Simulation</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
