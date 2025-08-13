import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/Layout/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { ContentPage } from './pages/ContentPage';
import { SchedulePage } from './pages/SchedulePage';
import { SettingsPage } from './pages/SettingsPage';
import { OAuthCallback } from './components/OAuthCallback';

function App() {
  return (
    <AppProvider>
      <Routes>
        {/* OAuth callback routes */}
        <Route path="/oauth/facebook/callback" element={<OAuthCallback />} />
        <Route path="/oauth/instagram/callback" element={<OAuthCallback />} />
        <Route path="/oauth/linkedin/callback" element={<OAuthCallback />} />
        <Route path="/oauth/twitter/callback" element={<OAuthCallback />} />
        <Route path="/oauth/tiktok/callback" element={<OAuthCallback />} />
        <Route path="/oauth/youtube/callback" element={<OAuthCallback />} />

        {/* Public routes */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          {/* Nested protected routes */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="companies/*" element={<CompaniesPage />} />
          <Route path="content/*" element={<ContentPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="settings/*" element={<SettingsPage />} />
        </Route>

        {/* Catch all - redirect to dashboard if authenticated, auth if not */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppProvider>
  );
}

export default App;