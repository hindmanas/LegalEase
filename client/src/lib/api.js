const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import { supabase } from './supabase.js';

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function authHeaders() {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = await authHeaders();
  
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  // We keep 'me' and 'updateProfile' mapped to the backend if the backend handles extra profile details.
  // Otherwise, if Supabase handles profile, we may remove them later. For now, we preserve backend compat.
  me: () => request('/auth/me'),
  updateProfile: (payload) => request('/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
  listDocuments: () => request('/documents'),
  uploadDocument: (payload) => request('/documents/upload', {
    method: 'POST',
    body: payload instanceof FormData ? payload : JSON.stringify(payload)
  }),
  getDocument: (id) => request(`/documents/${id}`),
  analyzeDocument: (id) => request(`/analysis/${id}`, { method: 'POST' }),
  downloadReport: async (id) => {
    const token = await getAuthToken();
    return `${API_URL}/analysis/${id}/report?token=${token || ''}`;
  },
  chat: (id, question) => request(`/chat/${id}`, { method: 'POST', body: JSON.stringify({ question }) })
};
