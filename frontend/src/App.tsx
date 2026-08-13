import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/authContext';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminModels from './pages/admin/AdminModels';
import AdminSystemPrompt from './pages/admin/AdminSystemPrompt';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminHealth from './pages/admin/AdminHealth';
import { Sparkles, RefreshCw } from 'lucide-react';

// Premium minimal dark loading screen
const ZyriconLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0518] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center gap-4 z-10">
        {/* Glowing Orb */}
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-600 p-0.5 shadow-lg shadow-purple-500/30 animate-pulse">
          <div className="w-full h-full rounded-full bg-[#0a0518] flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-purple-300 animate-spin" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold tracking-widest uppercase text-purple-200">Zyricon AI</h2>
          <p className="text-xs text-slate-400 font-medium tracking-wide">Loading Zyricon...</p>
        </div>
      </div>
    </div>
  );
};

// Protected route for general app users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, syncError, retrySync } = useAuth();

  if (syncError) {
    return (
      <div className="min-h-screen bg-[#0a0518] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#120826] border border-purple-900/50 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-100">Setup Interrupted</h3>
          <p className="text-xs text-slate-300">{syncError}</p>
          <button
            onClick={retrySync}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Profile Sync</span>
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin-only route protection
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

// Public route for login page (redirects logged-in users to /app)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isLoading, authTimedOut, retrySync } = useAuth();

  if (authTimedOut && isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0518] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#120826] border border-purple-900/50 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-100">Connection Delayed</h3>
          <p className="text-xs text-slate-300">Authentication is taking longer than expected.</p>
          <button
            onClick={retrySync}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <ZyriconLoadingScreen />;
  }

  return (
    <Routes>
      {/* Auth Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route path="/register" element={<RegisterPage />} />

      {/* Main User Workspace Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Dashboard Nested Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="models" element={<AdminModels />} />
        <Route path="system-prompt" element={<AdminSystemPrompt />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="health" element={<AdminHealth />} />
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

