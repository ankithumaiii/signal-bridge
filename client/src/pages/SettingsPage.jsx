import React, { useState, useEffect } from 'react';
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
  Radio,
  Send,
  MessageSquare
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

  // Safe Test SMS state
  const [testPhone, setTestPhone] = useState(user?.phone || '');
  const [testingSMS, setTestingSMS] = useState(false);
  const [smsTestResult, setSmsTestResult] = useState(null);

  // Safe Test WhatsApp state
  const [waTestPhone, setWaTestPhone] = useState(user?.phone || '');
  const [testingWA, setTestingWA] = useState(false);
  const [waTestResult, setWaTestResult] = useState(null);
  const [waStatus, setWaStatus] = useState(null);

  useEffect(() => {
    api.getWhatsAppStatus()
      .then((res) => setWaStatus(res))
      .catch(() => {});
  }, []);

  const handleSendTestWhatsApp = async (e) => {
    e.preventDefault();
    if (!waTestPhone.trim()) {
      setWaTestResult({
        success: false,
        status: 'failed',
        message: 'Please provide a valid destination phone number.'
      });
      return;
    }

    setTestingWA(true);
    setWaTestResult(null);

    try {
      const res = await api.sendTestWhatsApp({ to: waTestPhone.trim() });
      setWaTestResult({
        success: res.success,
        status: res.status,
        message: res.message || 'Test WhatsApp alert dispatched.',
        providerMessageId: res.providerMessageId,
        isDemoSimulated: res.isDemoSimulated,
        blocker: res.blocker
      });
    } catch (err) {
      setWaTestResult({
        success: false,
        status: 'failed',
        message: err.message || 'WhatsApp test request failed.',
        blocker: err.data?.blocker || null
      });
    } finally {
      setTestingWA(false);
    }
  };

  const handleSendTestSMS = async (e) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      setSmsTestResult({
        success: false,
        status: 'failed',
        message: 'Please provide a valid destination phone number.'
      });
      return;
    }

    setTestingSMS(true);
    setSmsTestResult(null);

    try {
      const res = await api.sendTestSMS({ to: testPhone.trim() });
      setSmsTestResult({
        success: res.success,
        status: res.status,
        message: res.message || 'Test SMS dispatched.',
        providerMessageId: res.providerMessageId,
        isDemoSimulated: res.isDemoSimulated,
        blocker: res.blocker
      });
    } catch (err) {
      setSmsTestResult({
        success: false,
        status: 'failed',
        message: err.message || 'SMS test request failed.',
        blocker: err.data?.blocker || null
      });
    } finally {
      setTestingSMS(false);
    }
  };

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
    navigate('/', { replace: true });
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '820px' }}>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-accent-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-accent)'
        }}>
          <Settings size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Account & Security Preferences
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Configure your verified safety identity, emergency medical ledger, and network sync settings
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.15rem',
          marginBottom: '1.25rem',
          color: 'var(--color-success)',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600
        }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.15rem',
          marginBottom: '1.25rem',
          color: 'var(--color-danger)',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600
        }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <User size={20} color="var(--color-accent)" />
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Personal Safety Profile & Medical Notes
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Critical telemetry attached to emergency broadcasts and 112 phone dispatches
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="form-group" style={{ marginBottom: '1.1rem' }}>
            <label className="form-label" htmlFor="sName">Full Legal / Account Name</label>
            <input
              id="sName"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid-2" style={{ marginBottom: '1.1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="sPhone">Your Registered Phone Number</label>
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

          <div className="grid-2" style={{ marginBottom: '1.1rem' }}>
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
              <label className="form-label">Email Address (Account Identifier)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                style={{ opacity: 0.65, cursor: 'not-allowed', background: 'var(--bg-canvas)' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="sNotes">Emergency Medical Notes & Allergies</label>
            <textarea
              id="sNotes"
              rows="3"
              value={formData.medicalNotes}
              onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
              placeholder="e.g., Type 1 Diabetic (carries insulin); allergic to Penicillin; contact Dr. Verma."
            ></textarea>
            <span className="form-help" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
              ℹ️ Automatically read out in the simulated 112 emergency phone dialer script.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.65rem 1.6rem' }}>
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Connectivity & Transport Details */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <Radio size={20} color="var(--color-accent)" />
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Connectivity & Offline Queue Engine
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Live telemetry and automated store-and-forward synchronizer status
            </p>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontWeight: 600 }}>Network Connection Status:</span>
            <span style={{
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: isOnline ? 'var(--color-success)' : 'var(--color-warning)'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? 'var(--color-success)' : 'var(--color-warning)' }} />
              {isOnline ? 'Online (HTTP + Socket.IO Active)' : 'Offline (Local Storage Buffered)'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontWeight: 600 }}>Local Offline Outbox Queue:</span>
            <span style={{ fontWeight: 700, background: 'var(--bg-canvas)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
              {queueCount} pending action(s)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0' }}>
            <span style={{ fontWeight: 600 }}>Hardware Bluetooth/LoRa Mesh:</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Requires native Android/iOS BLE daemon (web sandboxed)</span>
          </div>
        </div>
      </div>

      {/* SMS Gateway & Safe Test Dispatch Card */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <MessageSquare size={20} color="var(--color-accent)" />
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              SMS Carrier Gateway Diagnostic
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Verify carrier dispatch connectivity using a strictly non-emergency test alert
            </p>
          </div>
        </div>

        <div style={{
          background: 'var(--color-accent-light)',
          border: '1px solid var(--color-accent-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          marginBottom: '1.25rem',
          lineHeight: 1.5
        }}>
          <strong>Safety Isolation:</strong> This test is strictly non-emergency. It never dials 112, never creates an SOS incident in the database, and never notifies your emergency circle. In production, testing is restricted to allowlisted numbers.
        </div>

        <form onSubmit={handleSendTestSMS}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div style={{ flex: '1 1 240px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Allowlisted Test Mobile Number
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 9876543210 (10 digits)"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={testingSMS}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem' }}
            >
              <Send size={15} />
              <span>{testingSMS ? 'Transmitting...' : 'Send Safe Test SMS'}</span>
            </button>
          </div>
        </form>

        {smsTestResult && (
          <div style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${smsTestResult.success ? 'var(--color-safe-text)' : 'var(--color-emergency)'}`,
            background: smsTestResult.success ? 'var(--color-safe-bg)' : 'var(--color-emergency-bg)',
            color: smsTestResult.success ? 'var(--color-safe-text)' : 'var(--color-emergency-text)',
            fontSize: '0.84rem'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Status: {smsTestResult.status?.toUpperCase()}</span>
              {smsTestResult.isDemoSimulated && (
                <span style={{ fontSize: '0.72rem', background: 'var(--color-accent-light)', color: 'var(--color-accent)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                  DEMO SIMULATED
                </span>
              )}
            </div>
            <p style={{ margin: 0, lineHeight: 1.45 }}>{smsTestResult.message}</p>
            {smsTestResult.providerMessageId && (
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.76rem', opacity: 0.85 }}>
                Gateway Reference: <code>{smsTestResult.providerMessageId}</code>
              </p>
            )}
            {smsTestResult.blocker && (
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.76rem', fontWeight: 700 }}>
                Blocker Code: {smsTestResult.blocker}
              </p>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp Cloud API Safe Test Card */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            background: '#25D36620',
            color: '#25D366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageSquare size={20} color="#25D366" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                WhatsApp Cloud API Emergency Gateway Test
              </h3>
              {waStatus && (
                <span style={{
                  fontSize: '0.72rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  background: waStatus.enabled && waStatus.configured ? '#25D36625' : 'var(--color-accent-light)',
                  color: waStatus.enabled && waStatus.configured ? '#128C7E' : 'var(--color-accent)',
                  border: `1px solid ${waStatus.enabled && waStatus.configured ? '#25D36650' : 'var(--color-accent-border)'}`
                }}>
                  {waStatus.enabled && waStatus.configured ? `LIVE META ${waStatus.apiVersion}` : 'SAFE DEMO MODE'}
                </span>
              )}
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Verify official Meta WhatsApp Cloud API alert transmission using a non-emergency test message
            </p>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card-inset)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          marginBottom: '1.25rem',
          lineHeight: 1.5
        }}>
          <strong>Safety Isolation:</strong> This test is strictly non-emergency. It never dials 112, never creates an SOS incident in the database, and never notifies your emergency circle. In production, testing is restricted to allowlisted or verified profile numbers.
        </div>

        <form onSubmit={handleSendTestWhatsApp}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div style={{ flex: '1 1 240px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Allowlisted / Verified WhatsApp Mobile Number
              </label>
              <input
                type="tel"
                value={waTestPhone}
                onChange={(e) => setWaTestPhone(e.target.value)}
                placeholder="e.g. 9876543210 (10 digits)"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={testingWA}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', background: '#128C7E', borderColor: '#128C7E' }}
            >
              <Send size={15} />
              <span>{testingWA ? 'Transmitting...' : 'Send Safe Test WhatsApp'}</span>
            </button>
          </div>
        </form>

        {waTestResult && (
          <div style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${waTestResult.success ? '#25D366' : 'var(--color-emergency)'}`,
            background: waTestResult.success ? 'rgba(37, 211, 102, 0.08)' : 'var(--color-emergency-bg)',
            color: waTestResult.success ? '#128C7E' : 'var(--color-emergency-text)',
            fontSize: '0.84rem'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Status: {waTestResult.status?.toUpperCase()}</span>
              {waTestResult.isDemoSimulated && (
                <span style={{ fontSize: '0.72rem', background: 'var(--color-accent-light)', color: 'var(--color-accent)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                  DEMO SIMULATED
                </span>
              )}
            </div>
            <p style={{ margin: 0, lineHeight: 1.45 }}>{waTestResult.message}</p>
            {waTestResult.providerMessageId && (
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.76rem', opacity: 0.85 }}>
                Meta Gateway Message ID: <code>{waTestResult.providerMessageId}</code>
              </p>
            )}
            {waTestResult.blocker && (
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.76rem', fontWeight: 700 }}>
                Blocker Code: {waTestResult.blocker}
              </p>
            )}
          </div>
        )}
      </div>


      {/* Demo Mode Toggle */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Sparkles size={18} color="var(--color-accent)" />
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Hackathon Presentation Mode
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, maxWidth: '520px' }}>
              Toggles explicit honesty badges (`[DEMO SIMULATED]` SMS, manual carrier dispatches, and synthetic peer responses).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDemoMode(!demoMode)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-pill)',
              background: demoMode ? 'var(--color-accent-light)' : 'var(--bg-canvas)',
              color: demoMode ? 'var(--color-accent)' : 'var(--text-muted)',
              border: `1.5px solid ${demoMode ? 'var(--color-accent)' : 'var(--border-subtle)'}`,
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            {demoMode ? 'ACTIVE (DEMO ON)' : 'DISABLED'}
          </button>
        </div>
      </div>

      {/* Account Actions & Danger Zone */}
      <div className="card" style={{ padding: '1.75rem', border: '1.5px solid rgba(239, 68, 68, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-danger)' }}>
          <AlertTriangle size={18} />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Account Session & Privacy Controls</h2>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Sign out of your active workstation session or permanently purge your account records and emergency circle.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem 1rem' }}>
            <LogOut size={15} /> Log Out of Signal Bridge
          </button>
          <button onClick={handleDeleteAccount} className="btn btn-outline-danger btn-sm" style={{ padding: '0.5rem 1rem' }}>
            <Trash2 size={15} /> Delete Account & Clear Data
          </button>
        </div>
      </div>
    </div>
  );
};
