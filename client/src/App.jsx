import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import CoolLoader from './components/CoolLoader';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectWorkspace from './pages/ProjectWorkspace';
import VivaPractice from './pages/VivaPractice';

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
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
