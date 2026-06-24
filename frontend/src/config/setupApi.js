import axios from 'axios';
import { apiBaseURL } from '../services/api';

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
        const root = apiBaseURL.replace(/\/api$/,'');
        input = `${root}${input}`;
      } else if (input instanceof Request && input.url && input.url.startsWith('/api')) {
        const root = apiBaseURL.replace(/\/api$/,'');
        input = new Request(`${root}${input.url}`, input);
      }
    } catch (e) {
      // fallthrough to original fetch
    }
    return originalFetch(input, init);
  };
  window.__apiFetchPatched = true;
}

export default function setupApi() { return; }
