import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { SeedDatabase } from './pages/SeedDatabase';
import { AssignTask } from './pages/AssignTask';
import { RemovalRequest } from './pages/RemovalRequest';
import { RedZone } from './pages/RedZone';
import { Kpi } from './pages/Kpi';
import { TaskTable } from './pages/TaskTable';
import { Settings } from './pages/Settings';
import { Members } from './pages/Members';
import { BogusAttachment } from './pages/BogusAttachment';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/seed" element={<SeedDatabase />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/tasks" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assign"
            element={
              <ProtectedRoute>
                <AssignTask />
              </ProtectedRoute>
            }
          />
          <Route
            path="/removal"
            element={
              <ProtectedRoute>
                <RemovalRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/redzone"
            element={
              <ProtectedRoute>
                <RedZone />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kpi"
            element={
              <ProtectedRoute>
                <Kpi />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TaskTable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <Members />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bogus-attachment"
            element={
              <ProtectedRoute>
                <BogusAttachment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
