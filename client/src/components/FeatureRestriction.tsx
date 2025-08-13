import React from 'react';
import { Lock, Crown, ArrowRight } from 'lucide-react';

interface FeatureRestrictionProps {
  featureName: string;
  description?: string;
  requiredPlan: 'ipro' | 'business';
  onUpgrade?: () => void;
  className?: string;
}

export const FeatureRestriction: React.FC<FeatureRestrictionProps> = ({
  featureName,
  description,
  requiredPlan,
  onUpgrade,
  className = ''
}) => {
  const planNames = {
    ipro: 'iPro ($39.99/month)',
    business: 'Business Pro ($99.99/month)'
  };

  return (
    <div className={`bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-200 rounded-lg">
            <Lock className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{featureName}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
            <p className="text-sm text-blue-600 mt-1">
              Available with {planNames[requiredPlan]}
            </p>
          </div>
        </div>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Crown className="w-4 h-4" />
            <span>Upgrade</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  currentPlan: 'free' | 'ipro' | 'business';
  onUpgrade: (plan: 'ipro' | 'business') => void;
}

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  isOpen,
  onClose,
  featureName,
  currentPlan,
  onUpgrade
}) => {
  if (!isOpen) return null;

  const plans = {
    ipro: {
      name: 'iPro (Individual PRO)',
      price: '$39.99/month',
      features: [
        '1,000 textual posts per month',
        '20 image generations',
        'ChatGPT-4 & Gemini Pro',
        'Auto post scheduling',
        'Basic analytics',
        'All social platforms',
        '24/7 email support'
      ]
    },
    business: {
      name: 'Business Pro',
      price: '$99.99/month',
      features: [
        'Unlimited textual posts',
        '100 image generations',
        'All AI models access',
        'Advanced scheduling',
        'Comprehensive analytics',
        'Team collaboration',
        'Custom branding',
        'Priority support'
      ]
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unlock {featureName}</h2>
          <p className="text-gray-600">
            This feature requires a premium plan. Choose your upgrade option:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-lg ${
                key === 'ipro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              {key === 'ipro' && (
                <div className="text-center mb-3">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium inline-flex items-center">
                    <Crown className="w-3 h-3 mr-1" />
                    Recommended
                  </div>
                </div>
              )}
              
              <div className="text-center mb-4">
                <h3 className="font-bold text-gray-900">{plan.name}</h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">{plan.price}</div>
              </div>
              
              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => onUpgrade(key as 'ipro' | 'business')}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  key === 'ipro'
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Upgrade to {plan.name}
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};