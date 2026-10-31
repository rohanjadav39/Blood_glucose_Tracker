const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Standard fetch wrapper that automatically handles:
 * - JSON stringifying
 * - JWT Authorization header
 * - Error message extraction
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sweety_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        // Clear expired or invalid token
        localStorage.removeItem('sweety_token');
        localStorage.removeItem('sweety_user');
      }
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Auth API
  auth: {
    register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
    login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
    getMe: () => request('/auth/me', { method: 'GET' }),
  },

  // Readings API
  readings: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.date) query.append('date', params.date);
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
      if (params.slot) query.append('slot', params.slot);
      const qs = query.toString();
      return request(`/readings${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    create: (readingData) => request('/readings', { method: 'POST', body: readingData }),
    update: (id, readingData) => request(`/readings/${id}`, { method: 'PUT', body: readingData }),
    delete: (id) => request(`/readings/${id}`, { method: 'DELETE' }),
  },

  // Reports API
  reports: {
    getOverview: (date) => request(`/reports/overview?date=${date || ''}`, { method: 'GET' }),
    getDaily: (date) => request(`/reports/daily?date=${date || ''}`, { method: 'GET' }),
    getMonthToDate: (date) => request(`/reports/month-to-date?date=${date || ''}`, { method: 'GET' }),
    getMonthly: (date) => request(`/reports/monthly?date=${date || ''}`, { method: 'GET' }),
  },
};
