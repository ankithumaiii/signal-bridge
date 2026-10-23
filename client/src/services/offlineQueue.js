import { api } from './api.js';

const QUEUE_STORAGE_KEY = 'signal_bridge_offline_queue';

export const getOfflineQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveOfflineQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save offline queue', e);
  }
};

export const enqueueOfflineAction = (action) => {
  const queue = getOfflineQueue();
  const queueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: action.type, // 'send_message' | 'create_sos' | 'hazard_report'
    payload: action.payload,
    idempotencyKey: action.idempotencyKey || `idem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    queuedAt: new Date().toISOString(),
    status: 'queued_locally',
    attempts: 0
  };

  queue.push(queueItem);
  saveOfflineQueue(queue);

  // Dispatch custom storage event for reactive UI updates
  window.dispatchEvent(new Event('offline-queue-updated'));
  return queueItem;
};

// Flush pending queue when connection restores
export const processOfflineQueue = async (onItemProcessed) => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  const remaining = [];
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.type === 'send_message') {
        const { conversationId, text, messageType, location } = item.payload;
        await api.sendMessage(conversationId, {
          text,
          messageType,
          location,
          idempotencyKey: item.idempotencyKey,
          transportUsed: 'local_offline_queued'
        });
        processed++;
        if (onItemProcessed) onItemProcessed(item, true);
      } else if (item.type === 'create_sos') {
        await api.createSOS(item.payload);
        processed++;
        if (onItemProcessed) onItemProcessed(item, true);
      } else if (item.type === 'hazard_report') {
        await api.createHazard(item.payload);
        processed++;
        if (onItemProcessed) onItemProcessed(item, true);
      } else {
        remaining.push(item);
      }
    } catch (err) {
      console.warn('[Offline Queue Retry Failed]', err.message);
      item.attempts += 1;
      item.lastError = err.message;
      failed++;
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
  window.dispatchEvent(new Event('offline-queue-updated'));

  return { processed, failed, remainingCount: remaining.length };
};
