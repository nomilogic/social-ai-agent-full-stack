
import React, { useState } from 'react';
import { OnboardingCarousel } from '../components/OnboardingCarousel';
import { AuthForm } from '../components/AuthForm';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const { dispatch } = useAppContext();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    setShowAuth(true);
  };

  const handleAuthSuccess = (user: any) => {
    dispatch({ type: 'SET_USER', payload: user });
    navigate('/pricing');
  };

  const handleBackToCarousel = () => {
    setShowAuth(false);
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="min-h-screen flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <button
                onClick={handleBackToCarousel}
                className="text-blue-600 hover:text-blue-800 mb-4 flex items-center mx-auto"
              >
                ← Back to Overview
              </button>
              <p className="text-gray-600">
                Start your AI-powered social media journey
              </p>
            </div>
            <AuthForm onAuthSuccess={handleAuthSuccess} />
          </div>
        </div>
      </div>
    );
  }

  return <OnboardingCarousel onGetStarted={handleGetStarted} />;
};
