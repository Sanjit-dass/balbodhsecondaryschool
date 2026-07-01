import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

const safeStorage = {
  local: {
    getItem: (key) => {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: (key, value) => {
      try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
    },
    removeItem: (key) => {
      try { localStorage.removeItem(key); } catch (e) {}
    }
  },
  session: {
    getItem: (key) => {
      try { return sessionStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: (key, value) => {
      try { sessionStorage.setItem(key, value); return true; } catch (e) { return false; }
    },
    removeItem: (key) => {
      try { sessionStorage.removeItem(key); } catch (e) {}
    }
  }
};

const storage = {
  getUser: () => {
    try {
      const stored = safeStorage.local.getItem('user') || safeStorage.session.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
  getToken: () => {
    try {
      let token = safeStorage.local.getItem('token');
      if (!token) {
        token = safeStorage.session.getItem('token');
        if (token) {
          // Migrate older session-storage tokens to persistent localStorage
          safeStorage.local.setItem('token', token);
          const storedUser = safeStorage.session.getItem('user');
          if (storedUser) safeStorage.local.setItem('user', storedUser);
        }
      }
      if (token) {
        try { console.debug('[Auth][storage] token loaded (masked): %s', `${token.slice(0,8)}...`); } catch(e){}
      } else {
        try { console.debug('[Auth][storage] token missing'); } catch(e){}
      }
      return token;
    } catch (e) {
      console.warn('[Auth][storage] failed to read token from storage', e && e.message);
      return safeStorage.session.getItem('token') || null;
    }
  },
  setAuth: (token, user) => {
    safeStorage.local.setItem('token', token);
    safeStorage.local.setItem('user', JSON.stringify(user));
    safeStorage.session.removeItem('token');
    safeStorage.session.removeItem('user');
  },
  clear: () => {
    safeStorage.local.removeItem('token');
    safeStorage.local.removeItem('user');
    safeStorage.session.removeItem('token');
    safeStorage.session.removeItem('user');
  }
};

function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded?.user || null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => storage.getUser() || decodeToken(storage.getToken()));
  const [token, setToken] = useState(() => storage.getToken());
  const [loading, setLoading] = useState(Boolean(storage.getToken()));
  const [error, setError] = useState(null);
  const skipAuthCheckAfterLogin = useRef(false);

  const logout = useCallback((redirect = false) => {
    // Clear all auth state
    setToken(null);
    setUser(null);
    setError(null);
    
    // Clear all storage
    storage.clear();
    
    // Clear API authorization header
    api.setAuthToken(null);
    console.debug('[Auth] logout invoked, redirect:', Boolean(redirect));
    
    // Clear language preferences if needed
    try {
      localStorage.removeItem('language');
      sessionStorage.removeItem('language');
    } catch (e) {
      // ignore
    }
    
    // Clear any cached user data
    try {
      localStorage.removeItem('remember-me');
      sessionStorage.removeItem('currentUser');
      localStorage.removeItem('lastUser');
    } catch (e) {
      // ignore
    }
    
    // Note: do not force full page reload here; let the app handle SPA navigation.
    if (redirect) {
      // noop - redirect is handled by calling component via React Router.
    }
  }, []);

  const logoutAndRedirect = useCallback(() => {
    logout(false);
  }, [logout]);

  useEffect(() => {
    if (token) {
      api.setAuthToken(token);
      console.debug('[Auth] token set on api defaults (masked): %s', token ? `${token.slice(0,8)}...` : '');
    } else {
      api.setAuthToken(null);
      console.debug('[Auth] token cleared from api defaults');
    }
  }, [token]);

  useEffect(() => {
    console.debug('[Auth] auth check effect running. token present?', Boolean(token));
    if (!token) {
      console.debug('[Auth] no token available, skipping /auth/me');
      setLoading(false);
      return;
    }

    if (skipAuthCheckAfterLogin.current) {
      skipAuthCheckAfterLogin.current = false;
      console.debug('[Auth] skipping auth check after recent login');
      setLoading(false);
      return;
    }

    // Check if token is expired before making API call
    const decoded = decodeToken(token);
    if (decoded && decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        console.warn('[Auth] token expired, logging out');
        logout();
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    console.debug('[Auth] calling /auth/me to validate token');
    api.get('/auth/me')
      .then((res) => {
        console.debug('[Auth] /auth/me success, user restored:', res.data && res.data.user && res.data.user._id);
        setUser(res.data.user);
        storage.setAuth(token, res.data.user);
      })
      .catch((err) => {
        console.warn('[Auth] /auth/me failed, logging out. reason:', err && err.message);
        // Only logout on actual auth errors, not network errors
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          logout();
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, logout]);

  const login = async (email, password, remember = true, role = null) => {
    setLoading(true);
    setError(null);

    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const payload = { email: normalizedEmail, password };
      if (role) payload.role = String(role).trim().toLowerCase();
      const res = await api.post('/auth/login', payload);
      const { token: t, user: u } = res.data;
      skipAuthCheckAfterLogin.current = true;
      setToken(t);
      api.setAuthToken(t);
      setUser(u);
      storage.setAuth(t, u);
      return u;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please verify your credentials.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload) => {
    const res = await api.put('/auth/update-profile', payload);
    const updatedUser = res.data.user;
    setUser(updatedUser);
    storage.setAuth(token, updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: Boolean(user && token),
        login,
        logout,
        logoutAndRedirect,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
