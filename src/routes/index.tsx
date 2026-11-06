import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import OfficeSpace from '../pages/OfficeSpace';
import Lobby from '../pages/Lobby';
import MeetingRoom from '../pages/MeetingRoom';
import ScheduleMeeting from '../pages/ScheduleMeeting';
import AdminDashboard from '../pages/AdminDashboard';
import ProtectedRoute from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Google One-Click Login */}
      <Route path="/login" element={<Login />} />

      {/* 2. Spaces Dashboard (Screenshots 1 & 2) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* 3. 2D Virtual Office & Call Mode (Screenshots 3, 4, 5) */}
      <Route
        path="/v/:spaceId/office"
        element={
          <ProtectedRoute>
            <OfficeSpace />
          </ProtectedRoute>
        }
      />

      {/* 4. Classical Office Lobby / Rooms Directory */}
      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <Lobby />
          </ProtectedRoute>
        }
      />

      {/* 5. Meeting Room (WebRTC video & audio) */}
      <Route
        path="/room/:roomId"
        element={
          <ProtectedRoute>
            <MeetingRoom />
          </ProtectedRoute>
        }
      />

      {/* 6. Meeting Scheduling */}
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <ScheduleMeeting />
          </ProtectedRoute>
        }
      />

      {/* 7. Admin Panel */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default route -> Redirect to Dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
