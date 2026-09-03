import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import { initMobileDeviceExperience, getAppTarget } from './utils/mobileDevice';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Rider Pages
import RiderDashboard from './pages/rider/RiderDashboard';
import BookRidePage from './pages/rider/BookRidePage';
import MyRidesPage from './pages/rider/MyRidesPage';
import TrackRidePage from './pages/rider/TrackRidePage';

// Captain Pages
import CaptainDashboard from './pages/captain/CaptainDashboard';
import CaptainTripsPage from './pages/captain/CaptainTripsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CaptainApprovals from './pages/admin/CaptainApprovals';
import CaptainPayments from './pages/admin/CaptainPayments';
import SupportTickets from './pages/admin/SupportTickets';
import ManageCaptains from './pages/admin/ManageCaptains';
import ManageRiders from './pages/admin/ManageRiders';
import ManageBookings from './pages/admin/ManageBookings';

function AppContent() {
  const appTarget = getAppTarget();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    initMobileDeviceExperience(appTarget);
  }, [appTarget]);

  // Determine App Root Destination based on App Target
  const getRootElement = () => {
    if (appTarget === 'captain') {
      if (isAuthenticated && user?.role === 'captain') {
        return <Navigate to="/captain" replace />;
      }
      return <Navigate to="/login" replace />;
    }

    if (appTarget === 'rider') {
      if (isAuthenticated && user?.role === 'rider') {
        return <Navigate to="/rider/book" replace />;
      }
      return <Navigate to="/login" replace />;
    }

    // Default Web Portal Root
    return <LandingPage />;
  };

  return (
    <Router>
      <Routes>
        {/* Root Route */}
        <Route path="/" element={getRootElement()} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rider Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['rider']} />}>
          <Route path="/rider" element={<Navigate to="/rider/book" replace />} />
          <Route path="/rider/book" element={<BookRidePage />} />
          <Route path="/rider/my-rides" element={<MyRidesPage />} />
          <Route path="/rider/track/:id" element={<TrackRidePage />} />
        </Route>

        {/* Captain Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['captain']} />}>
          <Route path="/captain" element={<CaptainDashboard />} />
          <Route path="/captain/trips" element={<CaptainTripsPage />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/approvals" element={<CaptainApprovals />} />
          <Route path="/admin/captain-payments" element={<CaptainPayments />} />
          <Route path="/admin/support" element={<SupportTickets />} />
          <Route path="/admin/captains" element={<ManageCaptains />} />
          <Route path="/admin/riders" element={<ManageRiders />} />
          <Route path="/admin/bookings" element={<ManageBookings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
