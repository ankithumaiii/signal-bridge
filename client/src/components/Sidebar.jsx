import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  MapPin,
  PlusCircle,
  Users,
  MessageSquare,
  History,
  Settings,
  PhoneCall,
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo } from './Logo.jsx';

export const Sidebar = ({ isMobile = false, onClose = () => {} }) => {
  const { user } = useAuth();

  const navSections = [
    {
      title: 'COMMAND & CONTROL',
      items: [
        { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/app/sos', label: 'Emergency SOS', icon: AlertTriangle, isSos: true },
        { to: '/app/map', label: 'Safety Radar Map', icon: MapPin },
        { to: '/app/report', label: 'Report Hazard', icon: PlusCircle }
      ]
    },
    {
      title: 'SAFETY NETWORK',
      items: [
        { to: '/app/family', label: 'Trusted Contacts', icon: Users },
        { to: '/app/messages', label: 'Family Circle Chat', icon: MessageSquare }
      ]
    },
    {
      title: 'ACCOUNT & AUDIT',
      items: [
        { to: '/app/history', label: 'Incident History', icon: History },
        { to: '/app/settings', label: 'Settings & Privacy', icon: Settings }
      ]
    }
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        padding: '1.25rem 0.9rem',
        background: '#111928',
        color: '#E5E7EB'
      }}
    >
      {/* Top Header & Navigation */}
      <div>
        {/* Brand Header with Signal Bridge Halo Ring */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.25rem 0.5rem 1.25rem 0.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1.25rem'
          }}
        >
          <Logo size="medium" light={true} showText={true} />

          {isMobile && (
            <button
              onClick={onClose}
              aria-label="Close Navigation"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#9CA3AF',
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {navSections.map((section) => (
            <div key={section.title}>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.4)',
                  letterSpacing: '0.08em',
                  padding: '0 0.75rem',
                  marginBottom: '0.45rem'
                }}
              >
                {section.title}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={isMobile ? onClose : undefined}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.88rem',
                        fontWeight: isActive ? 700 : 500,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                        background: isActive
                          ? item.isSos
                            ? 'rgba(224, 36, 36, 0.16)'
                            : 'rgba(255, 72, 0, 0.12)'
                          : 'transparent',
                        color: isActive
                          ? item.isSos
                            ? '#F87171'
                            : '#FFFFFF'
                          : '#9CA3AF',
                        borderLeft: isActive
                          ? `3px solid ${item.isSos ? '#E02424' : '#FF4800'}`
                          : '3px solid transparent'
                      })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon
                          size={18}
                          color={item.isSos ? '#E02424' : undefined}
                          style={{ flexShrink: 0 }}
                        />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                      </div>

                      {item.isSos && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '99px',
                            background: '#E02424',
                            color: '#FFFFFF'
                          }}
                        >
                          SOS
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Actions & User Profile (Signal Bridge Account Card) */}
      <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Direct Call Emergency 112 Action Pill */}
        <a
          href="tel:112"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(224, 36, 36, 0.14)',
            border: '1px solid rgba(224, 36, 36, 0.35)',
            color: '#F87171',
            fontSize: '0.84rem',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(224, 36, 36, 0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(224, 36, 36, 0.14)'; }}
        >
          <PhoneCall size={16} />
          <span>Emergency ERSS 112</span>
        </a>

        {/* Signal Bridge Member Profile Card */}
        <div
          style={{
            padding: '0.75rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          {/* Avatar with initial */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF4800 0%, #FF7A00 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.95rem',
              boxShadow: '0 2px 8px rgba(255, 72, 0, 0.35)',
              flexShrink: 0
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.86rem',
                fontWeight: 700,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {user?.name || 'Rohan Verma'}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontWeight: 600
              }}
            >
              <ShieldCheck size={12} />
              <span>Verified Account</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
