import React, { useState } from 'react';
import { Sparkles, Info, X } from 'lucide-react';
import { useOffline } from '../context/OfflineContext.jsx';

export const DemoBanner = () => {
  const { demoMode } = useOffline();
  const [dismissed, setDismissed] = useState(false);

  if (!demoMode || dismissed) return null;

  return (
    <div
      className="system-banner"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.45rem 1.25rem',
        background: 'var(--text-primary)',
        color: '#FFFFFF',
        fontSize: '0.78rem',
        fontWeight: 600,
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 auto' }}>
        <span style={{
          background: 'var(--color-accent, #C56B45)',
          color: '#FFFFFF',
          padding: '0.15rem 0.5rem',
          borderRadius: 'var(--radius-pill)',
          fontSize: '0.68rem',
          fontWeight: 800,
          letterSpacing: '0.04em'
        }}>
          EVALUATION MODE
        </span>
        <span>
          Simulated carrier SMS dispatch & test mesh peer telemetry active. Real cellular broadcast requires production SMS gateway keys.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}
        title="Dismiss notice"
      >
        <X size={15} />
      </button>
    </div>
  );
};
