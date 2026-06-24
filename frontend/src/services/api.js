import axios from "axios";

const normalizeApiUrl = (value) => {
  const raw = String(value || '').trim();
  // In production require an explicit API URL to avoid accidental localhost usage
  if (!raw) {
    if (import.meta.env && import.meta.env.MODE === 'production') {
      throw new Error('VITE_API_URL must be set in production builds');
    }
    // allow a developer-friendly default in local dev only
    return 'http://localhost:5003';
  }
  if (/^:\d+$/.test(raw)) return `http://localhost${raw}`;
  if (/^\/\//.test(raw)) return `http:${raw}`;
  const normalized = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw) ? raw : `http://${raw}`;
  return normalized.replace(/\/+$/, '');
};

export const apiRoot = normalizeApiUrl(import.meta.env.VITE_API_URL);
export const apiBaseURL = apiRoot.endsWith("/api") ? apiRoot : `${apiRoot}/api`;

export function getImageUrl(p) {
  if (!p) return '/default-placeholder.png';
  try {
    if (typeof p === 'object') {
      if (p.url) return p.url;
      if (p.path) return `${apiRoot.replace(/\/api$/, '')}/${p.path}`;
      if (p.filename) return `${apiRoot.replace(/\/api$/, '')}/uploads/gallery/${p.filename}`;
    }
    const s = String(p || '').trim();
    if (!s) return '/default-placeholder.png';
    if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s;
    return `${apiRoot.replace(/\/api$/, '')}/uploads/gallery/${s}`;
  } catch (e) {
    return '/default-placeholder.png';
  }
}

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