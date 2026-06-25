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
  getToken: () => localStorage.getItem('token') || sessionStorage.getItem('token'),
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
    } else {
      api.setAuthToken(null);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (skipAuthCheckAfterLogin.current) {
      skipAuthCheckAfterLogin.current = false;
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        storage.setAuth(token, res.data.user, Boolean(localStorage.getItem('token')));
      })
      .catch(() => {
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
