import React, { createContext, useContext, useState, useEffect } from 'react';
import { getOfflineQueue, processOfflineQueue } from '../services/offlineQueue.js';

const OfflineContext = createContext(null);

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queueCount, setQueueCount] = useState(getOfflineQueue().length);
  const [isFlushing, setIsFlushing] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  const updateQueueCount = () => {
    setQueueCount(getOfflineQueue().length);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = () => {
      updateQueueCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-updated', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-updated', handleQueueChange);
    };
  }, []);

  const flushQueue = async () => {
    if (isFlushing) return;
    setIsFlushing(true);
    try {
      await processOfflineQueue();
      updateQueueCount();
    } finally {
      setIsFlushing(false);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        queueCount,
        isFlushing,
        demoMode,
        setDemoMode,
        flushQueue
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);
