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

  // After login, redirect users to campaigns page to create their first campaign
  // This matches the original company -> campaign flow
  
  // If user is authenticated but on auth page, redirect to campaigns
  if (location.pathname === '/auth') {
    return <Navigate to="/campaigns" replace />;
  }

  return <>{children}</>;
};