import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, AlertCircle, MapPin, MessageSquare } from 'lucide-react';

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
        background: '#FFFFFF',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
        padding: '0 0.5rem',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)'
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
          fontSize: '0.72rem',
          fontWeight: 600,
          color: isActive ? '#FF4800' : 'var(--text-muted)',
          textDecoration: 'none',
          padding: '0.35rem 0.6rem'
        })}
      >
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </NavLink>

      <NavLink
        to="/app/map"
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: isActive ? '#FF4800' : 'var(--text-muted)',
          textDecoration: 'none',
          padding: '0.35rem 0.6rem'
        })}
      >
        <MapPin size={20} />
        <span>Radar</span>
      </NavLink>

      {/* Floating Center SOS Button */}
      <NavLink
        to="/app/sos"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF4800 0%, #E02424 100%)',
          color: '#FFFFFF',
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(255, 72, 0, 0.5)',
          transform: 'translateY(-14px)',
          border: '3px solid #FFFFFF'
        }}
        aria-label="Emergency SOS Quick Trigger"
      >
        <AlertCircle size={28} />
      </NavLink>

      <NavLink
        to="/app/family"
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: isActive ? '#FF4800' : 'var(--text-muted)',
          textDecoration: 'none',
          padding: '0.35rem 0.6rem'
        })}
      >
        <Users size={20} />
        <span>Contacts</span>
      </NavLink>

      <NavLink
        to="/app/messages"
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: isActive ? '#FF4800' : 'var(--text-muted)',
          textDecoration: 'none',
          padding: '0.35rem 0.6rem'
        })}
      >
        <MessageSquare size={20} />
        <span>Chat</span>
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
