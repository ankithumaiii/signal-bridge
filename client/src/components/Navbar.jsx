import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Wifi, WifiOff, RefreshCw, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useOffline } from '../context/OfflineContext.jsx';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isOnline, queueCount, flushQueue, isFlushing, demoMode } = useOffline();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar-header" style={{
      height: 'var(--header-height)',
      background: 'rgba(11, 19, 43, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1rem',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* Brand */}
      <Link to={isAuthenticated ? '/app' : '/'} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #3A86FF 0%, #E63946 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(58, 134, 255, 0.4)'
        }}>
          <ShieldAlert size={20} color="#FFFFFF" />
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#F8F9FA', letterSpacing: '-0.02em' }}>
            SIGNAL <span style={{ color: 'var(--brand-blue)' }}>BRIDGE</span>
          </span>
        </div>
      </Link>

      {/* Center / System Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Connectivity Status */}
        <div
          title={isOnline ? 'Online (Connected to Signal Bridge Backend)' : 'Offline (Local Queue Enabled)'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            background: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.18)',
            border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: isOnline ? 'var(--color-success)' : 'var(--color-danger)'
          }}
        >
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span className="hide-mobile">{isOnline ? 'Online' : 'Offline'}</span>
          {queueCount > 0 && (
            <span
              onClick={flushQueue}
              style={{
                background: 'var(--brand-blue)',
                color: '#fff',
                borderRadius: 'var(--radius-full)',
                padding: '0.1rem 0.35rem',
                fontSize: '0.7rem',
                marginLeft: '0.2rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
              title="Click to sync queued items"
            >
              {isFlushing ? <RefreshCw size={10} className="spin" /> : `${queueCount} queued`}
            </span>
          )}
        </div>

        {/* Demo Indicator */}
        {demoMode && (
          <span className="badge badge-demo hide-mobile" title="Simulated SMS dispatch & Indian Emergency 112 Demo">
            DEMO
          </span>
        )}
      </div>

      {/* Right User / Auth Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              to="/app/settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <UserIcon size={16} />
              <span className="hide-mobile">{user?.name?.split(' ')[0] || 'User'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Log out"
              style={{ padding: '0.4rem 0.6rem' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/login" className="btn btn-secondary btn-sm">
              Log In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Register
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hide-mobile {
            display: none !important;
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};
