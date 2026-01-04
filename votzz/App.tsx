import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Páginas Públicas
import LandingPage from './pages/LandingPage';
import Pricing from './pages/Pricing';
import GovernanceSales from './pages/GovernanceSales';
import Testimonials from './pages/Testimonials';
import Blog from './pages/Blog';
import Compliance from './pages/Compliance';

// Autenticação e Registro
import Auth from './pages/Auth';
import CondoRegister from './pages/auth/CondoRegister';
import { AffiliateRegister } from './pages/auth/AffiliateRegister';
import ForgotPassword from './pages/ForgotPassword'; 

// Dashboards
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import AffiliateDashboard from './pages/dashboards/AffiliateDashboard';
import Dashboard from './pages/Dashboard';

// Funcionalidades do Sistema
import SubscriptionRenovation from './pages/subscription/SubscriptionRenovation'; 
import AssemblyList from './pages/AssemblyList';
import CreateAssembly from './pages/CreateAssembly';
import VotingRoom from './pages/VotingRoom';
import Governance from './pages/Governance';
import Reports from './pages/Reports';
import Spaces from './pages/Spaces'; 
import Profile from './pages/Profile'; 
import Tickets from './pages/Tickets';

// Componente de Proteção de Rotas
const PrivateRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Carregando...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'AFILIADO') return <Navigate to="/affiliate/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* --- ROTAS PÚBLICAS --- */}
          <Route path="/" element={<LandingPage user={null} />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/governance-sales" element={<GovernanceSales user={null} />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/compliance" element={<Compliance />} />
          
          {/* --- AUTENTICAÇÃO --- */}
          <Route path="/login" element={<Auth />} />
          <Route path="/affiliate/login" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* --- REGISTROS --- */}
          <Route path="/register-condo" element={<CondoRegister />} />
          <Route path="/affiliate/register" element={<AffiliateRegister />} />

          {/* --- ÁREA LOGADA --- */}
          
          <Route path="/dashboard" element={
            <PrivateRoute allowedRoles={['MORADOR', 'SINDICO', 'ADM_CONDO', 'MANAGER']}>
              <Layout><Dashboard /></Layout>
            </PrivateRoute>
          } />

          <Route path="/assemblies" element={
            <PrivateRoute allowedRoles={['MORADOR', 'SINDICO', 'ADM_CONDO', 'MANAGER']}>
              <Layout><AssemblyList /></Layout>
            </PrivateRoute>
          } />

          <Route path="/create-assembly" element={
            <PrivateRoute allowedRoles={['SINDICO', 'MANAGER', 'ADM_CONDO']}>
              <Layout><CreateAssembly /></Layout>
            </PrivateRoute>
          } />

          <Route path="/assembly/:id" element={
            <PrivateRoute allowedRoles={['MORADOR', 'SINDICO', 'ADM_CONDO', 'MANAGER']}>
              <Layout><VotingRoom /></Layout> 
            </PrivateRoute>
          } />

          <Route path="/governance" element={
            <PrivateRoute allowedRoles={['MORADOR', 'SINDICO', 'ADM_CONDO', 'MANAGER']}>
              <Layout><Governance user={null} /></Layout>
            </PrivateRoute>
          } />

          <Route path="/spaces" element={
            <PrivateRoute allowedRoles={['MORADOR', 'SINDICO', 'ADM_CONDO', 'MANAGER']}>
              <Layout><Spaces user={null}/></Layout>
            </PrivateRoute>
          } />

          <Route path="/tickets" element={
            <PrivateRoute allowedRoles={['MORADOR', 'SINDICO', 'ADM_CONDO', 'MANAGER']}>
               <Layout><Tickets /></Layout>
            </PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute allowedRoles={['MORADOR', 'SINDICO', 'ADM_CONDO', 'MANAGER', 'ADMIN', 'AFILIADO']}>
              <Layout><Profile /></Layout>
            </PrivateRoute>
          } />

          <Route path="/reports" element={
            <PrivateRoute allowedRoles={['SINDICO', 'MANAGER', 'ADM_CONDO']}>
              <Layout><Reports /></Layout>
            </PrivateRoute>
          } />

          <Route path="/subscription/renew" element={
            <PrivateRoute allowedRoles={['SINDICO', 'MANAGER']}>
               <Layout><SubscriptionRenovation /></Layout>
            </PrivateRoute>
          } />

          {/* --- ADMINS --- */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <Layout><SuperAdminDashboard /></Layout>
            </PrivateRoute>
          } />

          <Route path="/affiliate/dashboard" element={
            <PrivateRoute allowedRoles={['AFILIADO']}>
              <Layout><AffiliateDashboard /></Layout>
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;