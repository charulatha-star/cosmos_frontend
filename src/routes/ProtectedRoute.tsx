import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Allow external guests direct entry without sign in
  const isGuestLink = location.search.includes('guest=true') || location.pathname.includes('/guest');
  if (isGuestLink) {
    return children;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Authenticating..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Preserve full intended route including query params so after login they can join
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required and current user is not authorized
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '60px 20px', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Result
          status="403"
          title="Access Restricted"
          subTitle={`Your current role (${user.role}) does not have permission to view this section.`}
          extra={
            <Link to="/">
              <Button type="primary">Return to Lobby</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
