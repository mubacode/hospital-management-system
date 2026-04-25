import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './i18n';

// Auth
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import SetupAccount from './pages/auth/SetupAccount';
import SessionTimeout from './components/auth/SessionTimeout';

// Layout
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/layout/DashboardLayout';

// RBAC utility (single source of truth for role-based routing)
import { getHomePath } from './utils/roleGuard';

// ── Admin Pages ─────────────────────────────────────────────────────────────
import AdminDashboard from './pages/admin/Dashboard';
import DoctorManagement from './pages/admin/DoctorManagement';
import PatientManagement from './pages/admin/PatientManagement';
import AdminAppointmentManagement from './pages/admin/AppointmentManagement';
import UserManagement from './pages/admin/UserManagement';
import ReceptionManagement from './pages/admin/ReceptionManagement';
import ClinicManagement from './pages/admin/ClinicManagement';

// ── Doctor Pages ────────────────────────────────────────────────────────────
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorPatients from './pages/doctor/Patients';

// ── Patient Pages ───────────────────────────────────────────────────────────
import PatientDashboard from './pages/patient/Dashboard';
import BookAppointment from './pages/patient/BookAppointment';
import MedicalHistory from './pages/patient/MedicalHistory';

// ── Reception Pages ─────────────────────────────────────────────────────────
import ReceptionDashboard from './pages/reception/Dashboard';
import PatientRegistration from './pages/reception/PatientRegistration';
import GlobalScheduleMonitor from './pages/reception/AppointmentManagement';

// ── Shared ──────────────────────────────────────────────────────────────────
import ChangePassword from './pages/common/ChangePassword';

// ── Loading Splash ───────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
    <div className="text-center">
      <div className="spinner-border text-primary border-4 mb-3" role="status" style={{ width: '3rem', height: '3rem' }} />
      <div className="fw-bold text-muted">Initializing CarePlus...</div>
    </div>
  </div>
);

// ── 403 Screen ───────────────────────────────────────────────────────────────
const Unauthorized = () => (
  <div className="text-center py-5">
    <div className="fs-1 mb-3">🔒</div>
    <h3 className="fw-bold">Access Restricted</h3>
    <p className="text-muted">You don't have permission to view this page.</p>
  </div>
);

const SESSION_TIMEOUT_MINUTES = 15;
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on mount — data persistence
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const lastActivity = localStorage.getItem('lastActivity');

    if (token && userData) {
      const now = Date.now();
      const isInactive = lastActivity && (now - parseInt(lastActivity, 10) >= SESSION_TIMEOUT_MS);

      if (isInactive) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
      } else {
        try {
          setIsAuthenticated(true);
          setUser(JSON.parse(userData));
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  if (loading) return <LoadingScreen />;

  /**
   * ProtectedRoute — enforces BOTH:
   * 1. Authentication  (redirects to /login if not logged in)
   * 2. Role authorization (shows 403 if role not in allowedRoles)
   *
   * Uses the centralized RBAC utility via allowedRoles arrays that
   * mirror the permission map in utils/roleGuard.js.
   */
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) return <Unauthorized />;
    return children;
  };

  return (
    <Router>
      <div className="App d-flex flex-column min-vh-100">
        {isAuthenticated && (
          <SessionTimeout logout={logout} timeoutInMinutes={SESSION_TIMEOUT_MINUTES} />
        )}
        {!isAuthenticated ? (
          <>
            <Header isAuthenticated={false} logout={logout} />
            <main className="flex-grow-1 container py-4">
              <Routes>
                <Route path="/login" element={<Login login={login} />} />
                <Route path="/register" element={<Register />} />
                <Route path="/setup-account" element={<SetupAccount />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </main>
            <Footer />
          </>
        ) : (
          <DashboardLayout user={user} logout={logout}>
            <Routes>
              {/* ── Admin ─────────────────────────────────────────────────── */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><DoctorManagement /></ProtectedRoute>} />
              <Route path="/admin/patients" element={<ProtectedRoute allowedRoles={['admin']}><PatientManagement /></ProtectedRoute>} />
              <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['admin']}><AdminAppointmentManagement /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
              <Route path="/admin/reception" element={<ProtectedRoute allowedRoles={['admin']}><ReceptionManagement /></ProtectedRoute>} />
              <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['admin']}><ClinicManagement /></ProtectedRoute>} />

              {/* ── Doctor ────────────────────────────────────────────────── */}
              <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
              <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorAppointments /></ProtectedRoute>} />
              <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorPatients /></ProtectedRoute>} />

              {/* ── Patient ───────────────────────────────────────────────── */}
              <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
              <Route path="/patient/appointments/book" element={<ProtectedRoute allowedRoles={['patient']}><BookAppointment /></ProtectedRoute>} />
              <Route path="/patient/medical-history" element={<ProtectedRoute allowedRoles={['patient']}><MedicalHistory /></ProtectedRoute>} />

              {/* ── Reception ─────────────────────────────────────────────── */}
              <Route path="/reception" element={<ProtectedRoute allowedRoles={['receptionist']}><ReceptionDashboard /></ProtectedRoute>} />
              <Route path="/reception/patients/register" element={<ProtectedRoute allowedRoles={['receptionist']}><PatientRegistration /></ProtectedRoute>} />
              <Route path="/reception/appointments" element={<ProtectedRoute allowedRoles={['receptionist']}><GlobalScheduleMonitor /></ProtectedRoute>} />

              {/* ── Shared ────────────────────────────────────────────────── */}
              <Route path="/setup-account" element={<SetupAccount />} />
              <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

              {/* ── Smart Home Redirect ───────────────────────────────────── */}
              <Route path="/" element={<Navigate to={getHomePath(user?.role)} replace />} />

              {/* ── 404 Catch-all ─────────────────────────────────────────── */}
              <Route path="*" element={<Navigate to={getHomePath(user?.role)} replace />} />
            </Routes>
          </DashboardLayout>
        )}
      </div>
    </Router>
  );
}

export default App;
