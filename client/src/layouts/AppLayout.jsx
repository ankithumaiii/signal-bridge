import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu, X, LogOut, Settings, User as UserIcon,
  LayoutDashboard, AlertTriangle, MapPin, Users,
  MessageSquare, History, ChevronDown, Wifi, WifiOff,
  AlertCircle, PhoneCall, Sparkles, CreditCard
} from 'lucide-react';
import { OfflineBanner } from '../components/OfflineBanner.jsx';
import { DemoBanner } from '../components/DemoBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useOffline } from '../context/OfflineContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { getSocket } from '../services/socket.js';

export const AppLayout = () => {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const { isOnline, demoMode } = useOffline();
  const { coords } = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (user?._id) {
      const socket = getSocket();
      socket.emit('join_user', user._id);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px', height: '32px',
            border: '2.5px solid var(--color-border)',
            borderTopColor: 'var(--color-accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem auto'
          }} />
          <p style={{ color: 'var(--color-ink-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>
            Connecting to Signal Bridge…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const primaryNav = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/app/sos', label: 'Emergency', icon: AlertTriangle },
    { to: '/app/map', label: 'Safety Map', icon: MapPin },
    { to: '/app/family', label: 'Contacts', icon: Users },
  ];

  const secondaryNav = [
    { to: '/app/messages', label: 'Messages', icon: MessageSquare },
    { to: '/app/history', label: 'History', icon: History },
    { to: '/app/subscription', label: 'Plus Plan', icon: Sparkles },
    { to: '/app/settings', label: 'Settings', icon: Settings },
  ];

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.7rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.86rem',
    fontWeight: isActive ? 600 : 450,
    color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)',
    textDecoration: 'none',
    background: isActive ? 'var(--color-surface-alt)' : 'transparent',
    transition: 'all 0.12s ease',
    letterSpacing: '-0.005em'
  });

  return (
    <div className="app-shell">
      <div className="app-main-viewport">
        {/* System banners */}
        <OfflineBanner />
        <DemoBanner />

        {/* Horizontal Top Navigation */}
        <header className="app-topbar">
          {/* Left: Logo + primary nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="mobile-hamburger-btn"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '34px', height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ink)'
              }}
            >
              <Menu size={17} />
            </button>

            {/* Wordmark */}
            <NavLink to="/app" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'var(--color-emergency)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--color-surface)'
                }} />
              </div>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--color-ink)',
                letterSpacing: '-0.03em'
              }}>
                Signal Bridge
              </span>
            </NavLink>

            {/* Desktop primary nav */}
            <nav className="desktop-nav" style={{ display: 'none', alignItems: 'center', gap: '0.2rem' }}>
              {primaryNav.map(item => (
                <NavLink key={item.to} to={item.to} end={item.end} style={navLinkStyle}>
                  {item.label}
                </NavLink>
              ))}
              <span style={{ width: '1px', height: '18px', background: 'var(--color-border)', margin: '0 0.3rem' }} />
              {secondaryNav.slice(0, 3).map(item => (
                <NavLink key={item.to} to={item.to} style={navLinkStyle}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right: Status indicators + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {/* Connection status */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem', fontWeight: 550,
                background: isOnline ? 'var(--color-safe-bg)' : 'var(--color-emergency-bg)',
                color: isOnline ? 'var(--color-safe-text)' : 'var(--color-emergency-text)'
              }}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Emergency call — desktop only */}
            <a
              href="tel:112"
              className="desktop-only-chip"
              style={{
                display: 'none', alignItems: 'center', gap: '0.3rem',
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem', fontWeight: 600,
                background: 'var(--color-emergency-bg)',
                color: 'var(--color-emergency)',
                textDecoration: 'none'
              }}
            >
              <PhoneCall size={12} />
              <span>112</span>
            </a>

            {/* User dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.25rem 0.5rem 0.25rem 0.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-ink)',
                  fontSize: '0.82rem', fontWeight: 500
                }}
              >
                <div style={{
                  width: '24px', height: '24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-ink)',
                  color: 'var(--color-ink-inverse)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 700
                }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="desktop-only-text" style={{ display: 'none', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name ? user.name.split(' ')[0] : 'Account'}
                </span>
                <ChevronDown size={13} color="var(--color-ink-muted)" />
              </button>

              {profileOpen && (
                <>
                  <div onClick={() => setProfileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                    width: '200px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 999
                  }}>
                    <div style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.25rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                        {user?.name || 'User'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                        {user?.email || ''}
                      </div>
                    </div>

                    <button
                      onClick={() => { setProfileOpen(false); navigate('/app/subscription'); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-xs)',
                        background: 'transparent', color: 'var(--color-ink-secondary)',
                        fontSize: '0.82rem', fontWeight: 500, textAlign: 'left'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-alt)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Sparkles size={14} color="var(--color-accent)" />
                      <span>Plus Membership</span>
                    </button>

                    <button
                      onClick={() => { setProfileOpen(false); navigate('/app/settings'); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-xs)',
                        background: 'transparent', color: 'var(--color-ink-secondary)',
                        fontSize: '0.82rem', fontWeight: 500, textAlign: 'left'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-alt)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Settings size={14} />
                      <span>Settings</span>
                    </button>

                    <button
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-xs)',
                        background: 'transparent', color: 'var(--color-emergency)',
                        fontSize: '0.82rem', fontWeight: 500, textAlign: 'left'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-emergency-bg)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <LogOut size={14} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="app-content-scroll" id="main-content-scroll">
          <Outlet />
        </div>

        {/* Mobile bottom nav */}
        <nav className="mobile-bottom-nav" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          zIndex: 1000, paddingLeft: '0.25rem', paddingRight: '0.25rem',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}>
          <NavLink to="/app" end style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem',
            fontSize: '0.68rem', fontWeight: isActive ? 600 : 450,
            color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            textDecoration: 'none', padding: '0.3rem 0.5rem'
          })}>
            <LayoutDashboard size={19} />
            <span>Overview</span>
          </NavLink>

          <NavLink to="/app/map" style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem',
            fontSize: '0.68rem', fontWeight: isActive ? 600 : 450,
            color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            textDecoration: 'none', padding: '0.3rem 0.5rem'
          })}>
            <MapPin size={19} />
            <span>Map</span>
          </NavLink>

          {/* Center SOS */}
          <NavLink to="/app/sos" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '46px', height: '46px', borderRadius: '50%',
            background: 'var(--color-emergency)', color: 'var(--color-ink-inverse)',
            textDecoration: 'none',
            boxShadow: '0 2px 10px rgba(192, 57, 43, 0.35)',
            transform: 'translateY(-10px)',
            border: '2.5px solid var(--color-surface)'
          }} aria-label="Emergency SOS">
            <AlertCircle size={24} />
          </NavLink>

          <NavLink to="/app/family" style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem',
            fontSize: '0.68rem', fontWeight: isActive ? 600 : 450,
            color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            textDecoration: 'none', padding: '0.3rem 0.5rem'
          })}>
            <Users size={19} />
            <span>Contacts</span>
          </NavLink>

          <NavLink to="/app/messages" style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem',
            fontSize: '0.68rem', fontWeight: isActive ? 600 : 450,
            color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            textDecoration: 'none', padding: '0.3rem 0.5rem'
          })}>
            <MessageSquare size={19} />
            <span>Chat</span>
          </NavLink>
        </nav>
      </div>

      {/* Mobile side drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="app-sidebar-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="app-sidebar-mobile-drawer">
            <div style={{ padding: 'var(--space-5)' }}>
              {/* Drawer header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)',
                borderBottom: '1px solid var(--color-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'var(--color-emergency)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-surface)' }} />
                  </div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
                    Signal Bridge
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} style={{
                  background: 'transparent', width: '30px', height: '30px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)', color: 'var(--color-ink-muted)'
                }}>
                  <X size={18} />
                </button>
              </div>

              {/* Nav items */}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-ink-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.3rem' }}>
                  Main
                </div>
                {primaryNav.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to} to={item.to} end={item.end}
                      onClick={() => setMobileMenuOpen(false)}
                      style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.6rem 0.65rem', borderRadius: 'var(--radius-sm)',
                        fontSize: '0.9rem', fontWeight: isActive ? 600 : 450,
                        color: isActive ? 'var(--color-ink)' : 'var(--color-ink-secondary)',
                        background: isActive ? 'var(--color-surface-alt)' : 'transparent',
                        textDecoration: 'none'
                      })}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}

                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-ink-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 0.5rem', margin: '0.8rem 0 0.3rem 0' }}>
                  More
                </div>
                {secondaryNav.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to} to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.6rem 0.65rem', borderRadius: 'var(--radius-sm)',
                        fontSize: '0.9rem', fontWeight: isActive ? 600 : 450,
                        color: isActive ? 'var(--color-ink)' : 'var(--color-ink-secondary)',
                        background: isActive ? 'var(--color-surface-alt)' : 'transparent',
                        textDecoration: 'none'
                      })}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}

                {/* Report Hazard */}
                <NavLink
                  to="/app/report"
                  onClick={() => setMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.6rem 0.65rem', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem', fontWeight: isActive ? 600 : 450,
                    color: isActive ? 'var(--color-ink)' : 'var(--color-ink-secondary)',
                    background: isActive ? 'var(--color-surface-alt)' : 'transparent',
                    textDecoration: 'none'
                  })}
                >
                  <MapPin size={17} />
                  <span>Report Hazard</span>
                </NavLink>
              </nav>
            </div>

            {/* Drawer footer: user */}
            <div style={{
              padding: 'var(--space-4) var(--space-5)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'var(--color-ink)', color: 'var(--color-ink-inverse)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700
                }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{user?.name || 'User'}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>{user?.email || ''}</div>
                </div>
              </div>
              <button onClick={handleLogout} style={{
                background: 'transparent', color: 'var(--color-emergency)',
                padding: '0.3rem', borderRadius: 'var(--radius-sm)'
              }} title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-only-chip { display: flex !important; }
          .desktop-only-text { display: inline !important; }
        }
        @media (min-width: 1024px) {
          .mobile-hamburger-btn { display: none !important; }
          .desktop-nav { display: flex !important; }
          .mobile-bottom-nav { display: none !important; }
        }
        @media (max-width: 1023px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
};
