import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { useAppContext } from '../context/AppContext';

export const AuthPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already authenticated
  useEffect(() => {
    if (state.user) {
      // Determine where to redirect based on user state
      if (state.user.onboarding_completed) {
        navigate('/dashboard', { replace: true });
      } else if (!state.user.plan || state.user.plan === 'free') {
        navigate('/pricing', { replace: true });
      } else if (!state.user.profile_completed) {
        navigate('/onboarding/profile', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [state.user, navigate]);

  const handleAuthSuccess = (user: any) => {
    dispatch({ type: 'SET_USER', payload: user });
    // Navigation will be handled by the useEffect above
  };

  if (state.user) {
    return null; // Will redirect in useEffect
  }

  return <AuthForm onAuthSuccess={handleAuthSuccess} />;
};