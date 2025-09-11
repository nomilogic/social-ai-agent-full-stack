import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './components/Layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './pages/AuthPage';
import { PricingPage } from './pages/PricingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContentPage } from './pages/ContentPage';
import { SchedulePage } from './pages/SchedulePage';
import { SettingsPage } from './pages/SettingsPage';
import { OAuthCallback } from './components/OAuthCallback';
import { AuthOAuthCallback } from './components/AuthOAuthCallback';
import { LandingPage } from './pages/LandingPage';
import { ProfilePage } from './pages/ProfilePage'; // Import ProfilePage
import { CampaignsPage } from './pages/CampaignsPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import { themeManager } from './lib/theme';

// OAuth callback wrapper component
const OAuthCallbackWrapper = () => {
  const { dispatch } = useAppContext();
  
  const handleAuthSuccess = (user: any) => {
    dispatch({ type: 'SET_USER', payload: user });
    dispatch({ type: 'SET_LOADING', payload: false });
  };
  
  return <AuthOAuthCallback onAuthSuccess={handleAuthSuccess} />;
};

function App() {
  useEffect(() => {
    // Initialize theme system
    themeManager.initialize();
  }, []);

  return (
    <AppProvider>
      <AuthProvider>
        <Routes>
        {/* Landing page (public) */}
        <Route path="/" element={<LandingPage />} />

        {/* Public routes */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* OAuth callback routes */}
        <Route path="/oauth/:platform/callback" element={<OAuthCallback />} />
        
        {/* OAuth authentication callback routes */}
        <Route path="/auth/:provider/callback" element={<OAuthCallbackWrapper />} />

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

        <Route path="/profile/*" element={ // Changed from /campaigns/* to /profile/*
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage /> {/* Changed from CompaniesPage to ProfilePage */}
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* New campaigns route */}
        <Route path="/campaigns/*" element={
          <ProtectedRoute>
            <AppLayout>
              <CampaignsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Companies route redirects to campaigns for backward compatibility */}
        {/* <Route path="/campaigns/*" element={<Navigate to="/campaigns" replace />} /> */}

        <Route path="/content/*" element={
          <ProtectedRoute>
            <AppLayout>
              <ContentPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Direct /generate route - redirects to /content/generate */}
        <Route path="/generate" element={
          <ProtectedRoute>
            <Navigate to="/content/generate" replace />
          </ProtectedRoute>
        } />

        <Route path="/schedule" element={
          <ProtectedRoute>
            <AppLayout>
              <SchedulePage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/posts/schedule" element={
          <ProtectedRoute>
            <AppLayout>
              <SchedulePage />
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
      </AuthProvider>
    </AppProvider>
  );
}

export default App;