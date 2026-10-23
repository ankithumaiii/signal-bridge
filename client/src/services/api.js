const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

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

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // Check if network failed / offline
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const offlineError = new Error('Network error: Unable to reach Signal Bridge servers. You may be offline.');
      offlineError.isOffline = true;
      throw offlineError;
    }
    throw err;
  }
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

  // Hazards
  getHazards: (params = '') => apiFetch(`/api/hazards${params ? `?${params}` : ''}`),
  checkDuplicates: (params) => apiFetch(`/api/hazards/check-duplicates?${params}`),
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

  // Health
  checkHealth: () => apiFetch('/api/health')
};
