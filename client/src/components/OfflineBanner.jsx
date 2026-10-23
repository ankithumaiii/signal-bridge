import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOffline } from '../context/OfflineContext.jsx';

export const OfflineBanner = () => {
  const { isOnline, queueCount, flushQueue, isFlushing } = useOffline();

  if (isOnline && queueCount === 0) return null;

  if (!isOnline) {
    return (
      <div className="system-banner banner-offline">
        <WifiOff size={16} />
        <span>
          <strong>Offline Mode Active:</strong> You are currently disconnected. Emergency actions and family messages are queued locally and will automatically retry when reconnected.
        </span>
        {queueCount > 0 && (
          <span style={{ background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
            {queueCount} pending in queue
          </span>
        )}
      </div>
    );
  }

  if (queueCount > 0) {
    return (
      <div className="system-banner" style={{ background: '#EAF3ED', color: '#1B6A46', borderBottom: '1px solid #C8E2D4' }}>
        <RefreshCw size={15} className={isFlushing ? 'spin' : ''} />
        <span>
          Reconnected. <strong>{queueCount}</strong> pending item(s) ready to synchronize with Signal Bridge server.
        </span>
        <button
          onClick={flushQueue}
          disabled={isFlushing}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', height: '26px' }}
        >
          {isFlushing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    );
  }

  return null;
};
