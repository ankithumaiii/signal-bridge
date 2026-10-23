import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  User,
  Shield,
  PhoneCall,
  Sparkles,
  LogOut,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useOffline } from '../context/OfflineContext.jsx';
import { api } from '../services/api.js';

export const SettingsPage = () => {
  const { user, updateProfile, logout } = useAuth();
  const { demoMode, setDemoMode, isOnline, queueCount } = useOffline();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    emergencyContactPhone: user?.emergencyContactPhone || '',
    bloodGroup: user?.bloodGroup || '',
    medicalNotes: user?.medicalNotes || ''
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateProfile(formData);
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      'WARNING: Are you sure you want to permanently delete your Signal Bridge account and clear your personal contacts? This cannot be undone.'
    );
    if (!confirm) return;

    try {
      await api.deleteAccount();
      logout();
      navigate('/register');
    } catch (err) {
      alert(`Account deletion failed: ${err.message}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '780px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={24} color="var(--brand-blue)" /> Settings & Privacy Center
        </h1>
        <p style={{ fontSize: '0.875rem' }}>
          Manage your personal safety profile, emergency calling configuration, and privacy controls
        </p>
      </div>

      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          color: '#6EE7B7',
          fontSize: '0.85rem'
        }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'var(--color-danger-bg)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          color: '#FCA5A5',
          fontSize: '0.85rem'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Profile Form */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} color="var(--brand-blue)" /> Safety Profile & Medical Notes
        </h2>

        <form onSubmit={handleSaveProfile}>
          <div className="form-group">
            <label className="form-label" htmlFor="sName">Full Name</label>
            <input
              id="sName"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="sPhone">Your Phone Number</label>
              <input
                id="sPhone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sEmergPhone">Primary Emergency Contact Phone</label>
              <input
                id="sEmergPhone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="+91 98765 00000"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="sBlood">Blood Group</label>
              <select
                id="sBlood"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              >
                <option value="">Select (Optional)</option>
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
            <div className="form-group">
              <label className="form-label">Email (Read Only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sNotes">Critical Medical & Allergies Information</label>
            <textarea
              id="sNotes"
              rows="2"
              value={formData.medicalNotes}
              onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
              placeholder="e.g. Asthmatic, carries Ventolin inhaler in pocket; allergic to Penicillin."
            ></textarea>
            <span className="form-help">Automatically included in the official Call 112 dispatcher emergency readout.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Connectivity & Transport Details */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Radio size={18} color="var(--color-info)" /> Connectivity & Offline Queue Engine
        </h2>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span>Network Link:</span>
            <span style={{ fontWeight: 600, color: isOnline ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {isOnline ? 'Online (Connected)' : 'Offline (Local Storage Queue)'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span>Pending Offline Actions:</span>
            <span style={{ fontWeight: 600 }}>{queueCount} item(s)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span>Hardware Radio Mesh Status:</span>
            <span style={{ color: 'var(--text-muted)' }}>Requires Native Android BLE Daemon (Not available in Web Build)</span>
          </div>
        </div>
      </div>

      {/* Demo Mode Toggle */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="#E879F9" /> Hackathon Presentation Mode
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFFFFF' }}>Demo Simulations & Indicators</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Display demo badges and simulated recipient acknowledgement options for evaluation.
            </p>
          </div>
          <button
            onClick={() => setDemoMode(!demoMode)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: demoMode ? 'rgba(217, 70, 239, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              color: demoMode ? '#F0ABFC' : 'var(--text-muted)',
              border: `1px solid ${demoMode ? 'rgba(217, 70, 239, 0.4)' : 'var(--border-subtle)'}`,
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {demoMode ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      </div>

      {/* Account Actions & Danger Zone */}
      <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: '#FF6B6B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} /> Account & Privacy
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem' }}>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            <LogOut size={15} /> Log Out of Signal Bridge
          </button>
          <button onClick={handleDeleteAccount} className="btn btn-outline-danger btn-sm">
            <Trash2 size={15} /> Delete Account & Contacts
          </button>
        </div>
      </div>
    </div>
  );
};
