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
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <header style={{
        height: 'var(--header-height)',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(11, 19, 43, 0.85)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #3A86FF 0%, #E63946 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            SIGNAL <span style={{ color: 'var(--brand-blue)' }}>BRIDGE</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <Link to="/app" className="btn btn-primary btn-sm">
              Open Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <button onClick={handleDemoLogin} className="btn btn-secondary btn-sm" style={{ border: '1px solid rgba(217, 70, 239, 0.4)' }}>
                <Sparkles size={14} color="#E879F9" /> 1-Click Demo
              </button>
              <Link to="/login" className="btn btn-primary btn-sm">
                Log In
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '3.5rem 1.5rem 2.5rem 1.5rem', textAlign: 'center', maxWidth: '860px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(58, 134, 255, 0.12)',
          border: '1px solid rgba(58, 134, 255, 0.3)',
          color: 'var(--brand-blue)',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.25rem'
        }}>
          <Radio size={14} /> Offline-Aware Emergency Safety & Danger Radar
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem' }}>
          When Connectivity Fails, <br />
          <span style={{ background: 'linear-gradient(135deg, #3A86FF 0%, #E63946 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your Safety Lifeline Stays Intact.
          </span>
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          Signal Bridge connects families during urban disasters and personal emergencies. Activate one-touch verified SOS, coordinate over offline-queued family circles, and navigate around verified community hazards with transparent rule-based corroboration.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          <button onClick={handleDemoLogin} className="btn btn-sos btn-lg" style={{ minWidth: '200px' }}>
            <Sparkles size={18} /> Launch Live Demo
          </button>
          <Link to="/register" className="btn btn-secondary btn-lg" style={{ minWidth: '180px' }}>
            Create Account
          </Link>
          <a href="tel:112" className="btn btn-outline-danger btn-lg">
            <PhoneCall size={18} /> Quick Call 112
          </a>
        </div>

        {/* Status Indicators Pill Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          color: 'var(--text-muted)',
          fontSize: '0.85rem'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="var(--color-success)" /> GPS Coordinate Tracking
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <WifiOff size={16} color="var(--brand-blue)" /> Offline Queue & Idempotency
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <PhoneCall size={16} color="#FF6B6B" /> India ERSS 112 Integration Ready
          </span>
        </div>
      </section>

      {/* Feature Pillars */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem 3.5rem 1.5rem', width: '100%' }}>
        <div className="grid-3">
          <div className="card">
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(230, 57, 70, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <ShieldAlert size={24} color="#E63946" />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Verified SOS Workflow</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
              Press-and-hold trigger with cancellation grace period. Captures GPS coordinates, notifies emergency contacts, and generates structured dispatcher readouts for 112.
            </p>
          </div>

          <div className="card">
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(58, 134, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <MapPin size={24} color="#3A86FF" />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Safety Radar & Hazard Map</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
              Interactive OpenStreetMap tracking waterlogging, road closures, accidents, and fire. Community reports are verified through transparent spatial proximity rules.
            </p>
          </div>

          <div className="card">
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Users size={24} color="#10B981" />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Family Emergency Circles</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
              Private family messaging with real-time Socket.IO and offline-queued sync. Send "I'm Safe" check-ins and voluntary time-limited location sharing.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.5rem',
        textAlign: 'center',
        background: 'rgba(11, 19, 43, 0.95)',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <p>
          Signal Bridge &copy; {new Date().getFullYear()} — Built for Public Safety & Emergency Resilience.
        </p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
          Disclaimer: Browser-based web applications rely on available client hardware and connectivity. Standard emergency numbers (112) should always be dialed in life-threatening events.
        </p>
      </footer>
    </div>
  );
};
