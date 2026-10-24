import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { Logo } from '../components/Logo.jsx';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [forgotMsg, setForgotMsg] = useState(null);

  const { login, demoLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect immediately to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoadingDemo(true);
    try {
      await demoLogin();
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Demo login failed. Please try again.');
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address in the field above first.');
      return;
    }
    try {
      const data = await api.forgotPassword({ email });
      setForgotMsg(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-block', marginBottom: '0.85rem' }}>
            <Logo size="large" showText={false} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Sign in to Signal Bridge
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
            Emergency Safety Command & Family Alert Platform
          </p>
        </div>

        {/* 1-Click Demo Login */}
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading || loadingDemo}
            className="btn btn-secondary"
            style={{
              width: '100%',
              minHeight: '44px',
              background: '#FFF5F0',
              borderColor: 'rgba(255, 72, 0, 0.35)',
              color: '#FF4800',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem'
            }}
          >
            {loadingDemo ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Launching Demo Session…</span>
              </>
            ) : (
              <>
                <Sparkles size={16} color="#FF4800" />
                <span>1-Click Demo Login (Rohan Verma)</span>
              </>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Or sign in with email
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {error && (
          <div
            style={{
              background: '#FDE8E8',
              border: '1px solid #F8B4B4',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#9B1C1C',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {forgotMsg && (
          <div
            style={{
              background: '#DEF7EC',
              border: '1px solid #31C48D',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#03543F',
              fontSize: '0.84rem'
            }}
          >
            {forgotMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.84rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                style={{ paddingLeft: '2.5rem', minHeight: '42px' }}
              />
              <Mail
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '0.84rem' }}>Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Forgot?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: '2.5rem', minHeight: '42px' }}
              />
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || loadingDemo}
            className="btn btn-primary"
            style={{ width: '100%', minHeight: '44px', fontWeight: 800, fontSize: '0.92rem' }}
          >
            {loading ? 'Authenticating…' : 'Sign In to Command Center'}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
            Create one free &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
