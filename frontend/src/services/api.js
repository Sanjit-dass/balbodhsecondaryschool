import axios from "axios";

const normalizeApiUrl = (value) => {
  const raw = String(value || '').trim();
  // In production require an explicit API URL to avoid accidental local dev host usage
  if (!raw) {
    if (import.meta.env && import.meta.env.MODE === 'production') {
      throw new Error('VITE_API_URL must be set in production builds');
    }
    // In dev: derive host from current location so the bundle doesn't embed a literal local dev host string
    if (typeof window !== 'undefined' && window.location) {
      const proto = window.location.protocol || 'http:';
      const host = window.location.hostname || '';
      return host ? `${proto}//${host}:5003` : '';
    }
    return '';
  }
  if (/^:\d+$/.test(raw)) {
    if (typeof window !== 'undefined' && window.location) {
      const proto = window.location.protocol || 'http:';
      const host = window.location.hostname || '';
      return host ? `${proto}//${host}${raw}` : '';
    }
    return '';
  }
  if (/^\/\//.test(raw)) return `http:${raw}`;
  const normalized = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw) ? raw : `http://${raw}`;
  return normalized.replace(/\/+$/, '');
};

export const apiRoot = normalizeApiUrl(import.meta.env.VITE_API_URL);
export const apiBaseURL = apiRoot.endsWith("/api") ? apiRoot : `${apiRoot}/api`;
export const API_BASE = apiRoot.replace(/\/api$/, '');

export function getImageUrl(p) {
  if (!p) return '/default-placeholder.png';
  try {
      if (typeof p === 'object') {
      if (p.url) return p.url;
      if (p.path) return `${API_BASE}/${p.path}`;
      if (p.filename) return `${API_BASE}/uploads/gallery/${p.filename}`;
    }
    const s = String(p || '').trim();
    if (!s) return '/default-placeholder.png';
    if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s;
    return `${API_BASE}/uploads/gallery/${s}`;
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
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        try { token = localStorage.getItem('token'); } catch (e) { token = null; }
        if (!token) {
          try { token = sessionStorage.getItem('token'); } catch (e) { token = null; }
        }
      }
      if (token) {
        try { console.debug('[Auth][api] attaching token to request (masked): %s', `${token.slice(0,8)}...`); } catch(e){}
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }
    } catch (e) {
      console.warn('[Auth][api] failed to read token from storage during request build', e && e.message);
    }
  }

  // Add cache-control headers to prevent caching of API responses
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0';
  config.headers['Pragma'] = 'no-cache';

  return config;
});

// Response interceptor: clear invalid tokens and reload for auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    try {
      // If the original request didn't include an Authorization header,
      // it's likely a public request — avoid forcing a global logout in that case.
      const reqHasAuth = Boolean(
        err?.config?.headers && (err.config.headers.Authorization || err.config.headers.authorization)
      );
      if (!reqHasAuth) {
        try { console.debug('[Auth][api] auth error on request without Authorization header — not clearing session'); } catch(e){}
        return Promise.reject(err);
      }
      const status = err?.response?.status;
      const message = err?.response?.data?.message || '';
      // Check for auth errors and clear session - only on explicit auth errors
      if (status === 401 || (status === 403 && /token is not valid|no token|unauthorized|forbidden/i.test(message))) {
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('language');
        sessionStorage.removeItem('language');
        localStorage.removeItem('remember-me');
        sessionStorage.removeItem('currentUser');
        
        // Force redirect to login only on 401
        if (status === 401 && typeof window !== 'undefined') {
          console.debug('[Auth][api] received 401 auth error, redirecting to login');
          // Use replace to prevent back button access
          window.location.replace('/login?force=true&t=' + Date.now());
        }
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