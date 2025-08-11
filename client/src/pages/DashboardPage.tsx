import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Calendar, Settings, ArrowRight, Sparkles, Target, Users, BarChart3 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const DashboardPage: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Check if user needs onboarding (no companies yet)
  useEffect(() => {
    const checkOnboarding = async () => {
      if (state.user && !state.selectedCompany) {
        try {
          const response = await fetch(`/api/companies?userId=${state.user.id}`);
          const companies = await response.json();
          if (companies.length === 0) {
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error('Error checking companies:', error);
        }
      }
    };

    checkOnboarding();
  }, [state.user, state.selectedCompany]);

  const onboardingSteps = [
    {
      title: 'Welcome to Social AI Agent!',
      description: 'Your AI-powered social media content creation platform',
      icon: Sparkles,
      content: 'Transform your social media presence with AI-generated content tailored to your brand. Let\'s get you started in just a few simple steps.',
    },
    {
      title: 'Create Your Company Profile',
      description: 'Set up your brand identity and voice',
      icon: Target,
      content: 'First, we\'ll create your company profile. This helps our AI understand your brand voice, target audience, and content preferences.',
    },
    {
      title: 'Generate Your First Content',
      description: 'Let AI create engaging posts for you',
      icon: Users,
      content: 'Once your profile is ready, you can start generating AI-powered content. Our system creates posts optimized for different social media platforms.',
    },
    {
      title: 'Publish & Schedule',
      description: 'Share your content across platforms',
      icon: BarChart3,
      content: 'Review, edit, and publish your content directly to your social media accounts or schedule them for optimal engagement times.',
    },
  ];

  const handleStartOnboarding = () => {
    navigate('/companies/new');
  };

  const nextOnboardingStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      handleStartOnboarding();
    }
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    const currentStep = onboardingSteps[onboardingStep];
    const Icon = currentStep.icon;

    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 bg-blue-100 text-blue-600 text-sm font-semibold px-3 py-1 rounded-full">
              {onboardingStep + 1}/{onboardingSteps.length}
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">{currentStep.title}</h1>
            <p className="text-xl text-gray-600">{currentStep.description}</p>
            <p className="text-gray-700 leading-relaxed max-w-lg mx-auto">
              {currentStep.content}
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={skipOnboarding}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Skip for now
            </button>
            <button
              onClick={nextOnboardingStep}
              className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <span>{onboardingStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  index === onboardingStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Create Content',
      description: 'Generate AI-powered social media posts',
      icon: Plus,
      color: 'bg-blue-600',
      action: () => navigate('/content'),
    },
    {
      title: 'Manage Companies',
      description: 'Add or edit your company profiles',
      icon: TrendingUp,
      color: 'bg-green-600',
      action: () => navigate('/companies'),
    },
    {
      title: 'Schedule Posts',
      description: 'Plan and schedule your content',
      icon: Calendar,
      color: 'bg-purple-600',
      action: () => navigate('/schedule'),
    },
    {
      title: 'Settings',
      description: 'Configure your preferences',
      icon: Settings,
      color: 'bg-gray-600',
      action: () => navigate('/settings'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-sm text-white p-8">
        <h1 className="text-3xl font-bold mb-4">
          Welcome back, {state.user?.user_metadata?.name || state.user?.email}!
        </h1>
        <p className="text-blue-100 text-lg mb-6">
          Ready to create amazing social media content with AI? Let's get started.
        </p>
        {!state.selectedCompany && (
          <button
            onClick={() => navigate('/companies/new')}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-semibold"
          >
            Create Your First Company Profile
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={index}
              onClick={action.action}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
            >
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-gray-600 text-sm">{action.description}</p>
            </div>
          );
        })}
      </div>

      {/* Show onboarding again button if no companies */}
      {!state.selectedCompany && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Started with Your First Content</h2>
          <p className="text-gray-600 mb-6">
            Create your company profile to unlock AI-powered content generation tailored to your brand.
          </p>
          <button
            onClick={() => setShowOnboarding(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Show Getting Started Guide
          </button>
        </div>
      )}
    </div>
  );
};