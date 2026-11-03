import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Lobby from '../pages/Lobby';
import MeetingRoom from '../pages/MeetingRoom';
import ScheduleMeeting from '../pages/ScheduleMeeting';
import AdminDashboard from '../pages/AdminDashboard';
import ProtectedRoute from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Office Lobby (Employees and Admins) */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Employee']}>
            <Lobby />
          </ProtectedRoute>
        }
      />

      {/* Meeting Room (Admins, Employees, and invited Guests) */}
      <Route
        path="/room/:roomId"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Employee', 'Guest']}>
            <MeetingRoom />
          </ProtectedRoute>
        }
      />

      {/* Meeting Scheduling (Admins and Employees) */}
      <Route
        path="/schedule"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Employee']}>
            <ScheduleMeeting />
          </ProtectedRoute>
        }
      />

      {/* Admin Panel (Admin role only) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
