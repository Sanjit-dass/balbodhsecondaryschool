import React, { useContext } from 'react';
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
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user.role)) {
    const fallback = DEFAULT_ROLE_HOME[user.role] || '/login';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
