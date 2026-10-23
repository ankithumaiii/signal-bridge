import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  MapPin,
  PlusCircle,
  Users,
  MessageSquare,
  History,
  Settings,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/sos', label: 'Emergency SOS', icon: AlertTriangle, isSos: true },
    { to: '/app/map', label: 'Safety Radar Map', icon: MapPin },
    { to: '/app/report', label: 'Report Hazard', icon: PlusCircle },
    { to: '/app/family', label: 'Trusted Contacts', icon: Users },
    { to: '/app/messages', label: 'Family Circle Chat', icon: MessageSquare },
    { to: '/app/history', label: 'Incident History', icon: History },
    { to: '/app/settings', label: 'Settings & Privacy', icon: Settings }
  ];

  return (
    <aside
      className="desktop-sidebar"
      style={{
        position: 'fixed',
        top: 'var(--header-height)',
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: 'rgba(11, 19, 43, 0.98)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 0.75rem',
        overflowY: 'auto',
        zIndex: 900
      }}
    >
      <div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.7rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  background: isActive
                    ? item.isSos
                      ? 'rgba(230, 57, 70, 0.18)'
                      : 'rgba(58, 134, 255, 0.14)'
                    : 'transparent',
                  color: isActive
                    ? item.isSos
                      ? '#FF6B6B'
                      : '#FFFFFF'
                    : 'var(--text-secondary)',
                  border: isActive
                    ? `1px solid ${item.isSos ? 'rgba(230, 57, 70, 0.4)' : 'rgba(58, 134, 255, 0.35)'}`
                    : '1px solid transparent'
                })}
              >
                <Icon size={18} color={item.isSos ? '#E63946' : undefined} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Emergency 112 Direct Quick Action */}
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <a
          href="tel:112"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(230, 57, 70, 0.12)',
            border: '1px solid rgba(230, 57, 70, 0.35)',
            color: '#FF6B6B',
            fontSize: '0.85rem',
            fontWeight: 700,
            textDecoration: 'none'
          }}
        >
          <PhoneCall size={16} />
          <span>Call Emergency 112</span>
        </a>

        {/* User Card */}
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--brand-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#FFFFFF'
            }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name || 'Logged In'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.email || ''}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-sidebar {
            display: flex !important;
          }
        }
      `}</style>
    </aside>
  );
};
