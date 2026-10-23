import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, AlertCircle, Map, MessageSquare } from 'lucide-react';

export const BottomNav = () => {
  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'rgba(11, 19, 43, 0.96)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
        padding: '0 0.5rem'
      }}
    >
      <NavLink
        to="/app"
        end
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.7rem',
          fontWeight: 600,
          color: isActive ? 'var(--brand-blue)' : 'var(--text-muted)',
          textDecoration: 'none',
          padding: '0.4rem'
        })}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/app/family"
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.7rem',
          fontWeight: 600,
          color: isActive ? 'var(--brand-blue)' : 'var(--text-muted)',
          textDecoration: 'none',
          padding: '0.4rem'
        })}
      >
        <Users size={20} />
        <span>Family</span>
      </NavLink>

      {/* Prominent Center SOS */}
      <NavLink
        to="/app/sos"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '54px',
          height: '54px',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, #E63946 0%, #D90429 100%)',
          color: '#FFFFFF',
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(230, 57, 70, 0.5)',
          marginTop: '-18px',
          border: '3px solid var(--bg-dark-primary)'
        }}
      >
        <AlertCircle size={26} />
      </NavLink>

      <NavLink
        to="/app/map"
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.7rem',
          fontWeight: 600,
          color: isActive ? 'var(--brand-blue)' : 'var(--text-muted)',
          textDecoration: 'none',
          padding: '0.4rem'
        })}
      >
        <Map size={20} />
        <span>Radar</span>
      </NavLink>

      <NavLink
        to="/app/messages"
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.7rem',
          fontWeight: 600,
          color: isActive ? 'var(--brand-blue)' : 'var(--text-muted)',
          textDecoration: 'none',
          padding: '0.4rem'
        })}
      >
        <MessageSquare size={20} />
        <span>Circle</span>
      </NavLink>

      <style>{`
        @media (min-width: 1024px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
};
