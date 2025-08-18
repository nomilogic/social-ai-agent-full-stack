
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Crown, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ProfileSetupFree } from '../components/ProfileSetupFree';
import { ProfileSetupPro } from '../components/ProfileSetupPro';
import { ProfileSetupBusiness } from '../components/ProfileSetupBusiness';

interface PricingTier {
  id: 'free' | 'ipro' | 'business';
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: React.ComponentType<any>;
  popular?: boolean;
  buttonText: string;
  buttonClass: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'aiFree',
    price: '$0',
    description: 'Perfect for getting started',
    features: [
      'Basic content creation',
      'Limited AI generations (5/month)',
      'Manual posting only',
      '1 social platform',
      'Basic templates'
    ],
    icon: Star,
    buttonText: 'Get Started Free',
    buttonClass: 'bg-gray-600 hover:bg-gray-700 text-white'
  },
  {
    id: 'ipro',
    name: 'aiPRO',
    price: '$39.99',
    description: 'Most popular for creators',
    features: [
      '1000 textual posts per month',
      '20 AI image generations',
      'ChatGPT-4 & Gemini Pro access',
      'Auto post scheduling',
      'Multi-platform support',
      'Advanced analytics',
      'Priority support'
    ],
    icon: Zap,
    popular: true,
    buttonText: 'Start Pro Trial',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  {
    id: 'business',
    name: 'aiBusiness',
    price: '$99.99',
    description: 'For teams and businesses',
    features: [
      'Unlimited content creation',
      'Unlimited AI generations',
      'All AI models access',
      'Advanced scheduling',
      'Team collaboration',
      'White-label options',
      'Custom integrations',
      'Dedicated support'
    ],
    icon: Crown,
    buttonText: 'Start Business Trial',
    buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white'
  }
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'ipro' | 'business' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (planId: 'free' | 'ipro' | 'business') => {
    setLoading(true);
    setSelectedPlan(planId);

    try {
      // Store the selected plan in context
      dispatch({ type: 'SET_USER_PLAN', payload: planId });
      
      // Check if user already has a profile in the database
      if (state.user?.id) {
        const response = await fetch(`/api/auth/profile?userId=${state.user.id}&email=${state.user.email}`);
        if (response.ok) {
          const existingProfile = await response.json();
          if (existingProfile && existingProfile.name) {
            // User already has a profile, update their plan and go to dashboard
            const updatedProfile = { ...existingProfile, plan: planId };
            
            // Update profile in database with new plan
            await fetch('/api/auth/profile', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updatedProfile),
            });
            
            // Update context and navigate to dashboard
            dispatch({ type: 'SET_SELECTED_PROFILE', payload: updatedProfile });
            dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
            navigate('/dashboard');
            return;
          }
        }
      }
      
      // No existing profile found, show the profile setup form
    } catch (error) {
      console.error('Error selecting plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPricing = () => {
    setSelectedPlan(null);
    dispatch({ type: 'SET_USER_PLAN', payload: null });
  };

  const handleProfileComplete = () => {
    // Navigate to dashboard after profile setup
    navigate('/dashboard');
  };

  if (selectedPlan) {
    const selectedTier = pricingTiers.find(tier => tier.id === selectedPlan);
    const userType = selectedPlan === 'business' ? 'business' : 'individual';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <button
              onClick={handleBackToPricing}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4 mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pricing
            </button>
            <div className="mb-6">
              <div className={`inline-flex items-center px-6 py-3 rounded-full ${selectedTier?.buttonClass}`}>
                {selectedTier && <selectedTier.icon className="w-6 h-6 mr-2" />}
                <span className="font-semibold">{selectedTier?.name} Plan Selected</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {selectedPlan === 'free' && (
              <ProfileSetupFree onComplete={handleProfileComplete} />
            )}
            {selectedPlan === 'ipro' && (
              <ProfileSetupPro onComplete={handleProfileComplete} />
            )}
            {selectedPlan === 'business' && (
              <ProfileSetupBusiness onComplete={handleProfileComplete} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`relative bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 hover:scale-105 ${
                  tier.popular ? 'border-2 border-blue-500 ring-2 ring-blue-200' : 'border border-gray-200'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <Icon className={`w-12 h-12 mx-auto mb-4 ${
                    tier.popular ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-gray-600 mb-4">{tier.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    {tier.price !== '$0' && <span className="text-gray-600 ml-2">/month</span>}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(tier.id)}
                  disabled={loading && selectedPlan === tier.id}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${tier.buttonClass} ${
                    loading && selectedPlan === tier.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading && selectedPlan === tier.id ? 'Setting up...' : tier.buttonText}
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            All plans include a 14-day free trial. No credit card required for Free plan.
          </p>
        </div>
      </div>
    </div>
  );
};
