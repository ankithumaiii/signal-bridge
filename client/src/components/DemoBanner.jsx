import React, { useState } from 'react';
import { Sparkles, Info, X } from 'lucide-react';
import { useOffline } from '../context/OfflineContext.jsx';

export const DemoBanner = () => {
  const { demoMode } = useOffline();
  const [dismissed, setDismissed] = useState(false);

  if (!demoMode || dismissed) return null;

  return (
    <div className="system-banner banner-demo" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
        <Sparkles size={15} color="#E879F9" />
        <span>
          <strong>HACKATHON DEMO MODE:</strong> Seeded contacts and simulated notification receipts active. Real production carrier dispatch requires live SMS gateway keys.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'transparent', border: 'none', color: '#E879F9', cursor: 'pointer', padding: '0 0.5rem' }}
        title="Dismiss notice"
      >
        <X size={15} />
      </button>
    </div>
  );
};
