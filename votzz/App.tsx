
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AssemblyList from './pages/AssemblyList';
import CreateAssembly from './pages/CreateAssembly';
import VotingRoom from './pages/VotingRoom';
import Reports from './pages/Reports';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';
import GovernanceSales from './pages/GovernanceSales';
import Blog from './pages/Blog';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import Testimonials from './pages/Testimonials';
import Governance from './pages/Governance';
import Facilities from './pages/Facilities';
import Compliance from './pages/Compliance';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { User } from './types';

// Wrapper for protected routes
interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={<LandingPage user={user} />} 
        />
        <Route 
          path="/governance-solutions" 
          element={<GovernanceSales user={user} />} 
        />
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" /> : <Auth onLogin={handleLogin} />
          } 
        />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<Blog />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Protected Routes - Wrapped in Layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Dashboard user={user} />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/governance" element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Governance user={user} />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/facilities" element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Facilities user={user} />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/assemblies" element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <AssemblyList user={user} />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/create-assembly" element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              {user?.role === 'MANAGER' ? <CreateAssembly /> : <Navigate to="/assemblies" />}
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/assembly/:id" element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <VotingRoom user={user} />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
