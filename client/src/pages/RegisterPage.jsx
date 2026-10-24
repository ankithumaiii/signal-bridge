import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Heart, AlertCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo } from '../components/Logo.jsx';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    emergencyContactPhone: '',
    bloodGroup: '',
    medicalNotes: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        emergencyContactPhone: formData.emergencyContactPhone,
        bloodGroup: formData.bloodGroup,
        medicalNotes: formData.medicalNotes
      });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-block', marginBottom: '0.85rem' }}>
            <Logo size="large" showText={false} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Open Your Safety Account
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
            Configure your responder credentials and emergency circle
          </p>
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

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Full Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Rohan Verma"
                style={{ minHeight: '40px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Email Address *</label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="rohan@family.net"
                style={{ minHeight: '40px' }}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Password *</label>
              <input
                type="password"
                name="password"
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 chars"
                style={{ minHeight: '40px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                required
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                style={{ minHeight: '40px' }}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Your Mobile Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+919876543210"
                style={{ minHeight: '40px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Emergency Contact Phone</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                placeholder="+919876543211"
                style={{ minHeight: '40px' }}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Blood Group</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                style={{ minHeight: '40px' }}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Critical Medical Notes</label>
              <input
                type="text"
                name="medicalNotes"
                value={formData.medicalNotes}
                onChange={handleChange}
                placeholder="e.g. Asthmatic, Penicillin allergy"
                style={{ minHeight: '40px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', minHeight: '44px', fontWeight: 800, fontSize: '0.92rem' }}
          >
            {loading ? 'Creating Safety Profile...' : 'Complete Account Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
            Sign in &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
