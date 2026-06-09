import axios from "axios";

const normalizeApiUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return 'http://localhost:5000';
  if (/^:\d+$/.test(raw)) return `http://localhost${raw}`;
  if (/^\/\//.test(raw)) return `http:${raw}`;
  const normalized = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw) ? raw : `http://${raw}`;
  return normalized.replace(/\/+$/, '');
};

export const apiRoot = normalizeApiUrl(import.meta.env.VITE_API_URL || 'http://localhost:5000');
export const apiBaseURL = apiRoot.endsWith("/api")
  ? apiRoot
  : `${apiRoot}/api`;

const api = axios.create({
  baseURL: apiBaseURL,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  if (!config.headers?.Authorization) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }
  }

  return config;
});

// Response interceptor: clear invalid tokens and reload for auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    try {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || '';
      if (status === 401 && /token is not valid|no token/i.test(message)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        // reload so app can show login screen
        if (typeof window !== 'undefined') window.location.reload();
      }
    } catch (e) {
      // ignore
    }
    return Promise.reject(err);
  }
);

api.setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export default api;