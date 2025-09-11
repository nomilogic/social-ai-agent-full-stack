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
      const from = (location.state as any)?.from?.pathname || '/content';
      navigate(from, { replace: true });
    }
  }, [state.user, navigate, location]);

  const handleAuthSuccess = (user: any) => {
    dispatch({ type: 'SET_USER', payload: user });
    
    // Set user plan and business account status based on login response
    if (user.plan) {
      dispatch({ type: 'SET_USER_PLAN', payload: user.plan });
    }
    if (user.profile_type === 'business') {
      dispatch({ type: 'SET_BUSINESS_ACCOUNT', payload: true });
    }
    
    const from = (location.state as any)?.from?.pathname || '/content';
    navigate(from, { replace: true });
  };

  if (state.user) {
    return null; // Will redirect in useEffect
  }

  return <AuthForm onAuthSuccess={handleAuthSuccess} />;
};