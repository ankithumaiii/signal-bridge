import React, { useState, useEffect } from 'react';
import { PhoneCall, Copy, Check, Info, X } from 'lucide-react';
import { api } from '../services/api.js';

export const Call112Button = ({ emergencySummary, incidentId, variant = 'primary' }) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);

  useEffect(() => {
    if (showModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showModal]);

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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <h3 className="card-title" style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.15rem' }}>
                <PhoneCall size={20} /> Emergency 112 Dispatch Readout
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.3rem 0.6rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Read these critical facts verbatim to the 112 operator:
            </p>

            <pre
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                marginBottom: '1.25rem',
                lineHeight: 1.5
              }}
            >
              {emergencySummary}
            </pre>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={copySummary} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem 1rem' }}>
                {copied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy Summary'}</span>
              </button>
              <a
                href="tel:112"
                onClick={handleOpenDialer}
                className="btn btn-sm"
                style={{
                  background: 'var(--color-danger)',
                  color: '#FFFFFF',
                  padding: '0.5rem 1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 700
                }}
              >
                <PhoneCall size={16} />
                <span>Launch 112 Dialer</span>
              </a>
            </div>

            <div style={{
              marginTop: '1.25rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              lineHeight: 1.45
            }}>
              <strong>Regulatory Notice:</strong> Signal Bridge initiates a standard telecommunications voice call to India's Emergency Response Support System (ERSS 112). No private automated backend data link is claimed unless authorized by public safety agencies.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
