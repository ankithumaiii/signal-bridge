import React, { useState } from 'react';
import { PhoneCall, Copy, Check, Info, X } from 'lucide-react';
import { api } from '../services/api.js';

export const Call112Button = ({ emergencySummary, incidentId, variant = 'primary' }) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);

  const handleOpenDialer = async () => {
    setCallInitiated(true);
    // Log call initiation to backend
    try {
      await api.log112Call({ incidentId, notes: 'User triggered Call 112 from UI button' });
    } catch (e) {
      console.warn('Could not log 112 call to backend:', e.message);
    }
  };

  const copySummary = () => {
    if (!emergencySummary) return;
    navigator.clipboard.writeText(emergencySummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
        <a
          href="tel:112"
          onClick={handleOpenDialer}
          className={`btn ${variant === 'primary' ? 'btn-sos' : 'btn-secondary'} btn-lg`}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            fontWeight: 800
          }}
        >
          <PhoneCall size={20} />
          <span>Call 112 (Police / Fire / Ambulance)</span>
        </a>

        {emergencySummary && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn btn-secondary"
            title="View emergency dispatcher readout summary"
            style={{ padding: '0.75rem' }}
          >
            <Info size={20} />
          </button>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title" style={{ color: '#FF6B6B' }}>
                <PhoneCall size={20} /> Emergency 112 Readout Summary
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.25rem 0.5rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Read these exact details directly to the 112 emergency dispatcher:
            </p>

            <pre
              style={{
                background: 'rgba(11, 19, 43, 0.9)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                fontSize: '0.85rem',
                color: '#F8F9FA',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                marginBottom: '1rem'
              }}
            >
              {emergencySummary}
            </pre>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={copySummary} className="btn btn-secondary btn-sm">
                {copied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy Details'}</span>
              </button>
              <a
                href="tel:112"
                onClick={handleOpenDialer}
                className="btn btn-sos btn-sm"
              >
                <PhoneCall size={16} />
                <span>Open 112 Phone Dialer</span>
              </a>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.04)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <strong>Notice:</strong> Signal Bridge initiates standard voice call via your device's telecom provider to India's Emergency Response Support System (ERSS 112). No automated data link is claimed unless authorized by authorities.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
