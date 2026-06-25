import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const DEFAULT_ROLE_HOME = {
  superadmin: '/admin/dashboard',
  admin: '/admin/dashboard',
  principal: '/admin/dashboard',
  accountant: '/account/dashboard',
  examcontroller: '/exam/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
  parent: '/parent/dashboard'
};

export default function PrivateRoute({ children, roles = [] }) {
  const { user, loading, token } = useContext(AuthContext);

  // Prevent caching and back-button access
  useEffect(() => {
    // Set cache-control headers in browser
    if (typeof window !== 'undefined') {
      // Prevent page caching
      window.history.pushState(null, null, window.location.href);
      window.addEventListener('popstate', () => {
        window.history.pushState(null, null, window.location.href);
      });
    }
  }, []);

  if (loading) return null;
  
  // No token or no user: redirect to login
  if (!token || !user) {
    return <Navigate to="/login?force=true" replace />;
  }
  
  // Role check: if roles specified and user role doesn't match, redirect to role home
  if (roles.length > 0 && !roles.includes(user.role)) {
    const fallback = DEFAULT_ROLE_HOME[user.role] || '/login';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
