import React, { useState } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import {
  Menu,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Navigation,
  ShieldAlert,
  ChevronDown,
  Radio,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useOffline } from '../context/OfflineContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';

export const Navbar = ({ onOpenMobileMenu = () => {} }) => {
  const { user, logout } = useAuth();
  const { isOnline, queueCount, flushQueue, isFlushing, demoMode } = useOffline();
  const { coords, status: locationStatus, requestLocation } = useLocation();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  // Dynamic route titles
  const getPageTitle = () => {
    const path = routerLocation.pathname;
    if (path === '/app') return 'Emergency Command Center';
    if (path.includes('/sos')) return 'Emergency SOS Dispatch';
    if (path.includes('/map')) return 'Safety Radar Map';
    if (path.includes('/report')) return 'Report Community Hazard';
    if (path.includes('/family')) return 'Trusted Emergency Circle';
    if (path.includes('/messages')) return 'Family Circle Messages';
    if (path.includes('/history')) return 'Incident & SOS Log';
    if (path.includes('/settings')) return 'Settings & Privacy Controls';
    return 'Signal Bridge Safety Radar';
  };

  return (
    <header className="app-topbar">
      {/* Left: Mobile Toggle & Page Title / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open Navigation Menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(148, 163, 184, 0.08)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
          className="mobile-hamburger-btn"
        >
          <Menu size={18} />
        </button>

        {/* Page Title with Live Emerald Pulse Dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            title="Live Radar Telemetry Active"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--status-safe)',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)',
              flexShrink: 0
            }}
          />
          <h1 style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            margin: 0,
            whiteSpace: 'nowrap'
          }}>
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Telemetry Chips, Connection & User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Call 112 Direct Dial Action Pill */}
        <a
          href="tel:112"
          className="btn btn-sm"
          style={{
            background: '#FDE8E8',
            color: '#9B1C1C',
            border: '1px solid #F8B4B4',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)'
          }}
          title="Direct link to ERSS 112"
        >
          <PhoneCall size={13} color="#E02424" />
          <span>Call 112</span>
        </a>

        {/* GPS Location Telemetry Chip */}
        <div
          title={coords ? `Coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Click to acquire GPS coordinates'}
          onClick={!coords ? requestLocation : undefined}
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            background: coords ? '#FFF5F0' : '#F3F4F6',
            border: `1px solid ${coords ? 'rgba(255, 72, 0, 0.3)' : 'var(--border-subtle)'}`,
            fontSize: '0.75rem',
            color: coords ? '#FF4800' : 'var(--text-muted)',
            cursor: !coords ? 'pointer' : 'default',
            fontWeight: 600
          }}
          className="desktop-telemetry-chip"
        >
          <Navigation size={13} color={coords ? '#FF4800' : '#6B7280'} />
          <span>
            {coords
              ? `${coords.lat.toFixed(3)}°, ${coords.lng.toFixed(3)}°`
              : 'Acquire GPS'}
          </span>
        </div>

        {/* Online / Offline Sync Badge */}
        <div
          title={isOnline ? 'Active Connection to Signal Bridge Core' : `${queueCount} actions cached locally`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            background: isOnline ? 'var(--status-safe-bg)' : 'var(--status-danger-bg)',
            border: `1px solid ${isOnline ? 'rgba(14, 159, 110, 0.35)' : 'rgba(224, 36, 36, 0.35)'}`,
            fontSize: '0.75rem',
            fontWeight: 700,
            color: isOnline ? 'var(--status-safe-text)' : 'var(--status-danger-text)'
          }}
        >
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
          {!isOnline && queueCount > 0 && (
            <span style={{
              background: 'var(--sos-red)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-full)',
              padding: '0.05rem 0.35rem',
              fontSize: '0.65rem',
              fontWeight: 800
            }}>
              {queueCount}
            </span>
          )}
        </div>

        {/* Flush Queue Action if Offline Items Exist */}
        {isOnline && queueCount > 0 && (
          <button
            onClick={flushQueue}
            disabled={isFlushing}
            title="Sync locally cached actions to server"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: 'var(--brand-cyan)',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            <RefreshCw size={12} className={isFlushing ? 'spin' : ''} />
            <span>Sync ({queueCount})</span>
          </button>
        )}

        {/* Hackathon Demo Badge */}
        <div
          title="Running in hackathon demo mode with seeded test data"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(168, 85, 247, 0.14)',
            border: '1px solid rgba(168, 85, 247, 0.32)',
            color: '#C084FC',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.04em'
          }}
        >
          <span>DEMO</span>
        </div>

        {/* User Profile Dropdown Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(148, 163, 184, 0.08)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #FF4800 0%, #FF7A00 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.78rem',
              fontWeight: 800
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ? user.name.split(' ')[0] : 'Responder'}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {profileDropdownOpen && (
            <>
              <div
                onClick={() => setProfileDropdownOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 998 }}
              />
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '220px',
                background: 'var(--bg-card-solid)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 999
              }}>
                <div style={{ padding: '0.5rem 0.65rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.35rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {user?.name || 'Rohan Verma'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {user?.email || 'demo@signalbridge.org'}
                  </div>
                </div>

                <button
                  onClick={() => { setProfileDropdownOpen(false); navigate('/app/settings'); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <UserIcon size={15} />
                  <span>Account & Profile</span>
                </button>

                <button
                  onClick={() => { setProfileDropdownOpen(false); handleLogout(); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: '#F87171',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-telemetry-chip {
            display: flex !important;
          }
        }
        @media (min-width: 1024px) {
          .mobile-hamburger-btn {
            display: none !important;
          }
        }
        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};
