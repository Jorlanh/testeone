import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Páginas
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import AffiliateDashboard from './pages/dashboards/AffiliateDashboard';
import Dashboard from './pages/Dashboard';

const PrivateRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Auth />} />

          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute allowedRoles={['MORADOR', 'SINDICO', 'ADM_CONDO']}>
                <Layout><Dashboard user={null} /></Layout>
              </PrivateRoute>
            } 
          />

          <Route 
            path="/admin/dashboard" 
            element={
              <PrivateRoute allowedRoles={['ADMIN']}>
                <Layout><SuperAdminDashboard /></Layout>
              </PrivateRoute>
            } 
          />

          <Route 
            path="/affiliate/dashboard" 
            element={
              <PrivateRoute allowedRoles={['AFILIADO']}>
                <Layout><AffiliateDashboard /></Layout>
              </PrivateRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;