import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import CoolLoader from './components/CoolLoader';
import SystemNotifications from './components/SystemNotifications';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectWorkspace from './pages/ProjectWorkspace';
import VivaPractice from './pages/VivaPractice';
import UserProfile from './pages/UserProfile';
import JoinProject from './pages/JoinProject';
import { Menu, X } from 'lucide-react';

import { OnboardingProvider } from './context/OnboardingContext';
import OnboardingTour from './components/OnboardingTour';
import HelpCenter from './components/HelpCenter';
// Protection Shell Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <CoolLoader compact title="Verifying session" subtitle="Checking your credentials..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <CoolLoader compact title="Opening workspace" subtitle="Preparing your experience..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Layout Wrapper
const AppLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('capstone.sidebarCollapsed') === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.localStorage.setItem('capstone.sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''} ${mobileSidebarOpen ? 'sidebar-mobile-open' : ''}`}>
      <button
        type="button"
        className="sidebar-backdrop"
        onClick={() => setMobileSidebarOpen(false)}
        aria-label="Close navigation drawer"
      />
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <main className="main-content">
        <div className="main-mobile-shell">
          <button
            type="button"
            className="mobile-sidebar-toggle"
            onClick={() => setMobileSidebarOpen((current) => !current)}
            aria-label={mobileSidebarOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
            aria-pressed={mobileSidebarOpen}
          >
            {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {children}
      </main>
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <BrowserRouter>
          <SystemNotifications />
          <OnboardingTour />
          <HelpCenter />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Secure Workspace Shell Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/projects/:id" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectWorkspace />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/projects/:id/viva" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <VivaPractice />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <UserProfile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/:userId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <UserProfile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/join/:code"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <JoinProject />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </OnboardingProvider>
    </AuthProvider>
  );
};

export default App;
