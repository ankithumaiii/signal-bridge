import React, { useState } from 'react';
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
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo } from '../components/Logo.jsx';

export const LandingPage = () => {
  const { isAuthenticated, demoLogin } = useAuth();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    setLoadingDemo(true);
    try {
      await demoLogin();
      navigate('/app', { replace: true });
    } catch (e) {
      navigate('/login');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      {/* Top Bar */}
      <header className="landing-header">
        <Logo size="medium" showText={true} />

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <Link to="/app" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
              <span>Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <button
                onClick={handleDemoLogin}
                disabled={loadingDemo}
                className="btn btn-secondary btn-sm"
                style={{
                  borderColor: 'rgba(255, 72, 0, 0.35)',
                  color: '#FF4800',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {loadingDemo ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} color="#FF4800" />
                )}
                <span>Demo</span>
              </button>
              <Link to="/login" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
                Sign In
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: 'clamp(2.5rem, 6vw, 4.5rem) 1.25rem 2.5rem 1.25rem', textAlign: 'center', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: '#FFF5F0',
            border: '1px solid rgba(255, 72, 0, 0.3)',
            color: '#FF4800',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '1.25rem'
          }}
        >
          <Radio size={13} />
          <span>Institutional Safety System • Offline-Aware SOS Radar</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.85rem, 5.5vw, 3.4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '1rem',
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
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            maxWidth: '680px',
            margin: '0 auto 1.75rem auto'
          }}
        >
          Signal Bridge brings institutional-grade emergency dispatch, transparent community danger-zone corroboration, and offline synchronization — packaged in a clean, high-clarity emergency user interface.
        </p>

        {/* CTA Buttons */}
        <div className="landing-cta-group">
          {isAuthenticated ? (
            <Link
              to="/app"
              className="btn btn-primary btn-lg"
              style={{ fontSize: '1rem', fontWeight: 800, padding: '0.85rem 2rem' }}
            >
              <span>Open Emergency Command Center</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <button
                onClick={handleDemoLogin}
                disabled={loadingDemo}
                className="btn btn-primary btn-lg"
                style={{ fontSize: '1rem', fontWeight: 800, padding: '0.85rem 1.75rem' }}
              >
                {loadingDemo ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Launching Demo…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Launch Live Demo (Rohan Verma)</span>
                  </>
                )}
              </button>

              <Link
                to="/register"
                className="btn btn-secondary btn-lg"
                style={{ fontSize: '1rem', fontWeight: 700, padding: '0.85rem 1.5rem' }}
              >
                <span>Create Free Account</span>
                <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>

        {/* Institutional Trust Badges */}
        <div
          style={{
            marginTop: '2.5rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem 1.5rem',
            flexWrap: 'wrap',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            fontWeight: 600
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <PhoneCall size={15} color="#E02424" />
            <span>India ERSS 112 Compatible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <WifiOff size={15} color="#FF4800" />
            <span>Offline-Queue Fallback</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Lock size={15} color="#0E9F6E" />
            <span>End-to-End Cryptographic Security</span>
          </div>
        </div>
      </section>

      {/* 4 Feature Pillars */}
      <section style={{ maxWidth: '1180px', margin: '0 auto', padding: '1rem 1.25rem 4rem 1.25rem', width: '100%' }}>
        <div className="grid-4">
          {/* Pillar 1 */}
          <div className="card">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: '#FDE8E8',
                color: '#E02424',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.85rem'
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              1-Tap Emergency SOS
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Press-and-hold trigger prevents false alarms. Captures browser GPS telemetry, notifies trusted emergency circle, and opens immediate official 112 dialer.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="card">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.85rem'
              }}
            >
              <Compass size={20} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Transparent Hazard Radar
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Live map of floods, fires, tree falls, and accidents. Corroborated with mathematical Haversine proximity engine — zero black-box AI scores.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="card">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: '#FFF5F0',
                color: '#FF4800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.85rem'
              }}
            >
              <Users size={20} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Family Safety Circles
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              One-tap "I am Safe" check-ins, Socket.IO real-time channels, and offline queueing with idempotency keys so messages never duplicate or drop.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="card">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: '#DEF7EC',
                color: '#0E9F6E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.85rem'
              }}
            >
              <MapPin size={20} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Voluntary Location Privacy
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
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
          padding: '1.25rem 1.5rem',
          background: 'var(--color-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.8rem',
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
