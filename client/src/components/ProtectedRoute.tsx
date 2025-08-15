import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state } = useAppContext();
  const location = useLocation();

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Social AI Agent</h2>
          <p className="text-gray-600">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  if (!state.user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user has completed onboarding, redirect them away from onboarding pages
  if (state.user.onboarding_completed) {
    if (location.pathname === '/pricing' || location.pathname.startsWith('/onboarding')) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // If user hasn't selected a plan, redirect to pricing (unless already there)
  if (!state.user.plan || state.user.plan === 'free') {
    if (location.pathname !== '/pricing') {
      return <Navigate to="/pricing" replace />;
    }
  }

  // If user has plan but hasn't completed onboarding, redirect to onboarding profile setup
  if (state.user.plan && state.user.plan !== 'free' && !state.user.profile_completed) {
    if (!location.pathname.startsWith('/onboarding')) {
      return <Navigate to="/onboarding/profile" replace />;
    }
  }

  return <>{children}</>;
};