import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Radio,
  Users,
  MapPin,
  PhoneCall,
  Sparkles,
  ArrowRight,
  WifiOff,
  CheckCircle2,
  Lock,
  Compass,
  Activity,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo } from '../components/Logo.jsx';

export const LandingPage = () => {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    try {
      await demoLogin();
      navigate('/app');
    } catch (e) {
      navigate('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F4F6F8' }}>
      {/* Top Bar */}
      <header
        style={{
          height: 'var(--header-height)',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Logo size="medium" showText={true} />

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <Link to="/app" className="btn btn-primary btn-sm">
              Open Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <button
                onClick={handleDemoLogin}
                className="btn btn-secondary btn-sm"
                style={{ borderColor: 'rgba(255, 72, 0, 0.35)', color: '#FF4800', fontWeight: 700 }}
              >
                <Sparkles size={14} color="#FF4800" />
                <span>1-Click Demo</span>
              </button>
              <Link to="/login" className="btn btn-primary btn-sm">
                Log In
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '4rem 1.5rem 3rem 1.5rem', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: '#FFF5F0',
            border: '1px solid rgba(255, 72, 0, 0.3)',
            color: '#FF4800',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.5rem'
          }}
        >
          <Radio size={14} />
          <span>High-Reliability Safety System • Offline-Aware SOS Radar</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.3rem, 5vw, 3.6rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em'
          }}
        >
          When Network Fails, <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #FF4800 0%, #FF7A00 50%, #E02424 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Your Emergency Lifeline Stays Armed.
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto 2rem auto'
          }}
        >
          Signal Bridge brings institutional-grade emergency dispatch, transparent community danger-zone corroboration, and offline synchronization — packaged in a clean, high-clarity emergency user interface.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleDemoLogin}
            className="btn btn-primary btn-lg"
            style={{ fontSize: '1.05rem', fontWeight: 800, padding: '0.9rem 2rem' }}
          >
            <Sparkles size={18} />
            <span>Launch Live Demo (Rohan Verma)</span>
          </button>

          <Link
            to="/register"
            className="btn btn-secondary btn-lg"
            style={{ fontSize: '1.05rem', fontWeight: 700, padding: '0.9rem 1.75rem' }}
          >
            <span>Create Free Account</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Institutional Trust Badges */}
        <div
          style={{
            marginTop: '3.5rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            color: 'var(--text-muted)',
            fontSize: '0.84rem',
            fontWeight: 600
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <PhoneCall size={16} color="#E02424" />
            <span>Official India ERSS 112 Compatible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <WifiOff size={16} color="#FF4800" />
            <span>Idempotent Offline-Queue Fallback</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Lock size={16} color="#0E9F6E" />
            <span>End-to-End Cryptographic Security</span>
          </div>
        </div>
      </section>

      {/* 4 Feature Pillars (Signal Bridge Card Grid) */}
      <section style={{ maxWidth: '1180px', margin: '0 auto', padding: '1rem 1.5rem 5rem 1.5rem', width: '100%' }}>
        <div className="grid-4">
          {/* Pillar 1 */}
          <div className="card">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-sm)',
                background: '#FDE8E8',
                color: '#E02424',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              1-Tap Emergency SOS
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Press-and-hold trigger prevents false alarms. Captures browser GPS telemetry, notifies trusted emergency circle, and opens immediate official 112 dialer.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="card">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-sm)',
                background: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <Compass size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Transparent Hazard Radar
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              CartoDB Voyager live map of floods, fires, tree falls, and accidents. Corroborated with mathematical Haversine proximity engine — zero black-box AI scores.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="card">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-sm)',
                background: '#FFF5F0',
                color: '#FF4800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <Users size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Family Safety Circles
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              One-tap "I am Safe" check-ins, Socket.IO real-time channels, and offline queueing with idempotency keys so messages never duplicate or drop.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="card">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-sm)',
                background: '#DEF7EC',
                color: '#0E9F6E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <MapPin size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Voluntary Location Privacy
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Location sharing is 100% opt-in, auto-expires after selected hours (1h, 4h, 8h, 24h), and can be revoked with a single click at any time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.5rem 2rem',
          background: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}
      >
        <Logo size="small" showText={true} />
        <div>
          <span>Signal Bridge Platform • Offline-Aware Emergency Safety Edition • 2026</span>
        </div>
      </footer>
    </div>
  );
};
