import axios from 'axios';
import { apiBaseURL, API_BASE } from '../services/api';

// Ensure axios (when imported directly) uses the same baseURL
try {
  if (apiBaseURL) axios.defaults.baseURL = apiBaseURL;
} catch (e) {
  // ignore
}

// Monkey-patch fetch so calls like fetch('/api/...') are forwarded to the API host
if (typeof window !== 'undefined' && !window.__apiFetchPatched) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      if (typeof input === 'string' && input.startsWith('/api')) {
        input = `${API_BASE}${input}`;
      } else if (input instanceof Request && input.url && input.url.startsWith('/api')) {
        input = new Request(`${API_BASE}${input.url}`, input);
      }
    } catch (e) {
      // fallthrough to original fetch
    }
    return originalFetch(input, init);
  };
  window.__apiFetchPatched = true;
}

export default function setupApi() { return; }
