import React from 'react';
import { X, Crown, Star, Zap } from 'lucide-react';
import { PlanLimits } from '../utils/planFeatures';

interface PlanRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: keyof PlanLimits;
  currentPlan: 'free' | 'ipro' | 'business';
  limit: number;
  remaining: number;
  onUpgrade: (plan: 'ipro' | 'business') => void;
}

const featureDisplayNames: Record<keyof PlanLimits, string> = {
  posts_per_month: 'Posts per Month',
  ai_generations_per_day: 'AI Generations per Day',
  social_platforms: 'Social Platforms',
  campaigns: 'Campaigns',
  scheduled_posts: 'Scheduled Posts',
  analytics_retention_days: 'Analytics Retention',
  team_members: 'Team Members',
  auto_posting: 'Auto Posting',
  advanced_analytics: 'Advanced Analytics',
  priority_support: 'Priority Support',
  ai_training: 'AI Training',
  custom_branding: 'Custom Branding',
  api_access: 'API Access',
};

const planFeatures = {
  ipro: [
    '100 posts per month',
    '50 AI generations per day',
    '5 social platforms',
    '10 campaigns',
    'Auto posting',
    'Advanced analytics',
    'Custom branding',
  ],
  business: [
    'Unlimited posts',
    'Unlimited AI generations',
    'All social platforms',
    'Unlimited campaigns',
    'Priority support',
    'AI training',
    'API access',
    'Everything in iPro',
  ],
};

export const PlanRestrictionModal: React.FC<PlanRestrictionModalProps> = ({
  isOpen,
  onClose,
  feature,
  currentPlan,
  limit,
  remaining,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  const featureName = featureDisplayNames[feature] || feature;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="theme-bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold theme-text-primary">Upgrade Your Plan</h2>
          <button
            onClick={onClose}
            className="p-2 theme-text-light hover:theme-text-primary rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold theme-text-primary mb-2">
              {featureName} Limit Reached
            </h3>
            <p className="theme-text-secondary">
              You've used {limit - remaining} of {limit === -1 ? 'unlimited' : limit} {featureName.toLowerCase()} 
              {currentPlan === 'free' ? ' in your Free plan' : ` in your ${currentPlan} plan`}.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* iPro Plan */}
            <div className="relative border border-white/20 rounded-xl p-6 theme-bg-primary">
              <div className="absolute -top-3 left-6">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Popular
                </span>
              </div>
              <div className="flex items-center mb-4">
                <Star className="w-6 h-6 text-blue-500 mr-2" />
                <h4 className="text-lg font-semibold theme-text-primary">iPro</h4>
              </div>
              <div className="text-3xl font-bold theme-text-primary mb-1">$39.99</div>
              <div className="theme-text-secondary text-sm mb-6">/month</div>
              
              <ul className="space-y-3 mb-6">
                {planFeatures.ipro.map((feature, index) => (
                  <li key={index} className="flex items-center theme-text-secondary">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => onUpgrade('ipro')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Upgrade to iPro
              </button>
            </div>

            {/* Business Plan */}
            <div className="border border-white/20 rounded-xl p-6 theme-bg-primary">
              <div className="flex items-center mb-4">
                <Zap className="w-6 h-6 text-purple-500 mr-2" />
                <h4 className="text-lg font-semibold theme-text-primary">Business Pro</h4>
              </div>
              <div className="text-3xl font-bold theme-text-primary mb-1">$99.99</div>
              <div className="theme-text-secondary text-sm mb-6">/month</div>
              
              <ul className="space-y-3 mb-6">
                {planFeatures.business.map((feature, index) => (
                  <li key={index} className="flex items-center theme-text-secondary">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => onUpgrade('business')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Upgrade to Business Pro
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="theme-text-secondary text-sm">
              All plans include a 7-day free trial. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};