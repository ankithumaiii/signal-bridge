const rawBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawBase.replace(/\/+$/, '');

export const getAuthToken = () => localStorage.getItem('signal_bridge_token');
export const setAuthToken = (token) => localStorage.setItem('signal_bridge_token', token);
export const removeAuthToken = () => localStorage.removeItem('signal_bridge_token');

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  // 15-second timeout controller so phone network glitches or cold starts don't hang indefinitely
  const controller = new AbortController();
  const timeoutMs = options.timeout || 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal || controller.signal
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      let message = data.message;
      if (!message && (res.status === 502 || res.status === 503 || res.status === 504)) {
        message = 'Server is currently waking up (Render free tier). Please wait 10 seconds and try again.';
      }
      const error = new Error(message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Connection timed out. If on live server, it may be waking up from sleep. Please try again in a few seconds.');
      timeoutError.isTimeout = true;
      throw timeoutError;
    }
    // Check if network failed / offline
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const offlineError = new Error('Network error: Unable to reach Signal Bridge servers. You may be offline.');
      offlineError.isOffline = true;
      throw offlineError;
    }
    throw err;
  }
};

const toQueryString = (params) => {
  if (!params) return '';
  if (typeof params === 'string') return params.startsWith('?') ? params.substring(1) : params;
  if (params instanceof URLSearchParams) return params.toString();
  if (typeof params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    return searchParams.toString();
  }
  return String(params);
};

// API Surface Methods
export const api = {
  // Auth
  register: (body) => apiFetch('/api/auth/register', { method: 'POST', body }),
  login: (body) => apiFetch('/api/auth/login', { method: 'POST', body }),
  getMe: () => apiFetch('/api/auth/me'),
  updateProfile: (body) => apiFetch('/api/auth/profile', { method: 'PUT', body }),
  updateLocation: (body) => apiFetch('/api/auth/location', { method: 'PUT', body }),
  forgotPassword: (body) => apiFetch('/api/auth/forgot-password', { method: 'POST', body }),
  deleteAccount: () => apiFetch('/api/auth/account', { method: 'DELETE' }),

  // Dashboard
  getDashboardStats: () => apiFetch('/api/dashboard/stats'),

  // Contacts
  getContacts: () => apiFetch('/api/contacts'),
  addContact: (body) => apiFetch('/api/contacts', { method: 'POST', body }),
  updateContact: (id, body) => apiFetch(`/api/contacts/${id}`, { method: 'PUT', body }),
  deleteContact: (id) => apiFetch(`/api/contacts/${id}`, { method: 'DELETE' }),
  sendCheckIn: (body) => apiFetch('/api/contacts/checkin', { method: 'POST', body }),

  // SOS
  createSOS: (body) => apiFetch('/api/sos', { method: 'POST', body }),
  getActiveSOS: () => apiFetch('/api/sos/active'),
  getSOSHistory: () => apiFetch('/api/sos/history'),
  updateSOSStatus: (id, body) => apiFetch(`/api/sos/${id}/status`, { method: 'PUT', body }),
  log112Call: (body) => apiFetch('/api/sos/call-112', { method: 'POST', body }),
  acknowledgeSOS: (body) => apiFetch('/api/sos/acknowledge', { method: 'POST', body }),
  sendTestSMS: (body) => apiFetch('/api/sos/test-sms', { method: 'POST', body }),
  sendTestWhatsApp: (body) => apiFetch('/api/whatsapp/test', { method: 'POST', body }),
  getWhatsAppStatus: () => apiFetch('/api/whatsapp/status'),

  // Hazards
  getHazards: (params = '') => {
    const q = toQueryString(params);
    return apiFetch(`/api/hazards${q ? `?${q}` : ''}`);
  },
  checkDuplicates: (params = '') => {
    const q = toQueryString(params);
    return apiFetch(`/api/hazards/check-duplicates${q ? `?${q}` : ''}`);
  },
  createHazard: (body) => apiFetch('/api/hazards', { method: 'POST', body }),
  getMyHazards: () => apiFetch('/api/hazards/my'),
  corroborateHazard: (id, body) => apiFetch(`/api/hazards/${id}/corroborate`, { method: 'POST', body }),
  flagHazard: (id, body) => apiFetch(`/api/hazards/${id}/flag`, { method: 'POST', body }),
  resolveHazard: (id, body) => apiFetch(`/api/hazards/${id}/resolve`, { method: 'PUT', body }),

  // Messaging
  getConversations: () => apiFetch('/api/messages/conversations'),
  createConversation: (body) => apiFetch('/api/messages/conversations', { method: 'POST', body }),
  getMessages: (convId) => apiFetch(`/api/messages/conversations/${convId}/messages`),
  sendMessage: (convId, body) => apiFetch(`/api/messages/conversations/${convId}/messages`, { method: 'POST', body }),

  // Subscription & Entitlements
  getSubscriptionPlans: () => apiFetch('/api/subscription/plans'),
  getCurrentSubscription: () => apiFetch('/api/subscription/current'),
  cancelSubscription: () => apiFetch('/api/subscription/cancel', { method: 'POST' }),

  // Razorpay Payments
  createPaymentOrder: (body) => apiFetch('/api/payments/create-order', { method: 'POST', body }),
  verifyPayment: (body) => apiFetch('/api/payments/verify', { method: 'POST', body }),

  // SOS Notifications Status
  getIncidentNotifications: (id) => apiFetch(`/api/sos/${id}/notifications`),

  // Health
  checkHealth: () => apiFetch('/api/health')
};
