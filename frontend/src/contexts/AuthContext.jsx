import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

const storage = {
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  },
  getToken: () => {
    try {
      const t = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (t) {
        try { console.debug('[Auth][storage] token loaded (masked): %s', `${t.slice(0,8)}...`); } catch(e){}
      } else {
        try { console.debug('[Auth][storage] token missing'); } catch(e){}
      }
      return t;
    } catch (e) {
      // Some mobile browsers (private mode) may throw when accessing localStorage
      console.warn('[Auth][storage] failed to read token from storage', e && e.message);
      try {
        return sessionStorage.getItem('token') || null;
      } catch (e2) {
        console.warn('[Auth][storage] sessionStorage also unavailable', e2 && e2.message);
        return null;
      }
    }
  },
  setAuth: (token, user, remember) => {
    if (remember) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } else {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
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

    setLoading(true);
    console.debug('[Auth] calling /auth/me to validate token');
    api.get('/auth/me')
      .then((res) => {
        console.debug('[Auth] /auth/me success, user restored:', res.data && res.data.user && res.data.user._id);
        setUser(res.data.user);
        // store token and user; prefer localStorage if previously used
        const remember = Boolean(() => {
          try { return Boolean(localStorage.getItem('token')); } catch(e){ return false; }
        })();
        storage.setAuth(token, res.data.user, remember);
      })
      .catch((err) => {
        console.warn('[Auth] /auth/me failed, logging out. reason:', err && err.message);
        logout();
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
      storage.setAuth(t, u, remember);
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
    const remember = Boolean(localStorage.getItem('token'));
    storage.setAuth(token, updatedUser, remember);
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
