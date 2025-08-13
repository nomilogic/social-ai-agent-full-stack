import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/Layout/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { PricingPage } from './pages/PricingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContentPage } from './pages/ContentPage';
import { SchedulePage } from './pages/SchedulePage';
import { SettingsPage } from './pages/SettingsPage';
import { OAuthCallback } from './components/OAuthCallback';
import { LandingPage } from './pages/LandingPage';

function App() {
  return (
    <AppProvider>
      <Routes>
        {/* Landing page (public) */}
        <Route path="/" element={<LandingPage />} />

        {/* Public routes */}
        <Route path="/auth" element={<AuthPage />} />

        {/* OAuth callback routes */}
        <Route path="/oauth/:platform/callback" element={<OAuthCallback />} />

        {/* Protected routes */}
        <Route path="/pricing" element={
          <ProtectedRoute>
            <PricingPage />
          </ProtectedRoute>
        } />

        <Route path="/onboarding/*" element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/content/*" element={
          <ProtectedRoute>
            <AppLayout>
              <ContentPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/schedule" element={
          <ProtectedRoute>
            <AppLayout>
              <SchedulePage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/companies/*" element={
          <ProtectedRoute>
            <AppLayout>
              <CompaniesPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings/*" element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Catch all - redirect to auth by default if not logged in, otherwise to dashboard */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </AppProvider>
  );
}

export default App;