import React, { useState } from 'react';
import { Building2, Globe, Target, Palette, Goal, FileText, Linkedin, Twitter, Instagram, Facebook, Music, Youtube, User, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProfileInfo } from '../types';
import { useAppContext } from '../context/AppContext';

interface ProfileSetupProps {
  onNext?: (data: ProfileInfo) => void;
  onBack?: () => void;
  initialData?: Partial<ProfileInfo>;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onNext, onBack, initialData }) => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  
  const [formData, setFormData] = useState<ProfileInfo>({
    type: initialData?.type || 'individual',
    name: initialData?.name || '',
    website: initialData?.website || '',
    industry: initialData?.industry || '',
    description: initialData?.description || '',
    targetAudience: initialData?.targetAudience || '',
    brandTone: initialData?.brandTone || 'professional',
    goals: initialData?.goals || [],
    platforms: initialData?.platforms || [],
    plan: state.userPlan || 'free',
  });

  const [showPlanModal, setShowPlanModal] = useState(false);

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Food & Beverage',
    'Fashion', 'Real Estate', 'Automotive', 'Entertainment', 'Non-profit', 'Other'
  ];

  const individualIndustries = [
    'Content Creator', 'Influencer', 'Artist', 'Writer', 'Coach', 'Consultant',
    'Photographer', 'Designer', 'Developer', 'Freelancer', 'Personal Brand', 'Other'
  ];

  const toneOptions = [
    { value: 'professional', label: 'Professional', description: 'Formal and authoritative' },
    { value: 'playful', label: 'Playful', description: 'Fun and energetic' },
    { value: 'motivational', label: 'Motivational', description: 'Inspiring and uplifting' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and friendly' },
    { value: 'authoritative', label: 'Authoritative', description: 'Expert and trustworthy' },
  ];

  const businessGoalOptions = [
    'Brand Awareness', 'Lead Generation', 'Customer Engagement', 'Sales Conversion',
    'Community Building', 'Thought Leadership', 'Product Launch', 'Event Promotion'
  ];

  const individualGoalOptions = [
    'Personal Branding', 'Audience Growth', 'Content Monetization', 'Network Building',
    'Portfolio Showcase', 'Career Advancement', 'Creative Expression', 'Knowledge Sharing'
  ];

  const platformOptions = [
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: Instagram,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 border-pink-200'
    },
    { 
      id: 'twitter', 
      name: 'Twitter/X', 
      icon: Twitter,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50 border-sky-200'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: Linkedin,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 border-blue-300'
    },
    { 
      id: 'tiktok', 
      name: 'TikTok', 
      icon: Music,
      color: 'text-black',
      bgColor: 'bg-gray-50 border-gray-300'
    },
    { 
      id: 'youtube', 
      name: 'YouTube', 
      icon: Youtube,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200'
    },
  ];

  const plans = {
    free: {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '5 textual posts per month',
        '2 image generations',
        'Basic templates',
        '1 social platform',
        'Community support'
      ],
      limitations: [
        'No auto-scheduling',
        'No analytics',
        'Limited AI features',
        'Watermarked images'
      ]
    },
    ipro: {
      name: 'iPro (Individual PRO)',
      price: '$39.99',
      period: 'per month',
      features: [
        '1,000 textual posts per month',
        '20 image generations',
        'ChatGPT-4 integration',
        'Gemini Pro access',
        'Auto post scheduling',
        'Basic analytics',
        'All social platforms',
        '24/7 email support',
        'Advanced templates',
        'Content calendar'
      ],
      limitations: []
    },
    business: {
      name: 'Business Pro',
      price: '$99.99',
      period: 'per month',
      features: [
        'Unlimited textual posts',
        '100 image generations',
        'All AI models access',
        'Advanced auto-scheduling',
        'Comprehensive analytics',
        'Team collaboration',
        'Custom branding',
        'Priority support',
        'Advanced targeting',
        'Campaign management',
        'Bulk upload',
        'API access'
      ],
      limitations: []
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.platforms.length > 0) {
      try {
        // Complete onboarding and redirect to content creation
        dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
        
        // Call onNext if provided (for backward compatibility)
        if (onNext) {
          onNext(formData);
        } else {
          // New flow: redirect directly to content creation
          navigate('/content');
        }
      } catch (error) {
        console.error('Error completing profile setup:', error);
      }
    }
  };

  const handlePlanSelect = (planType: 'free' | 'ipro' | 'business') => {
    setFormData(prev => ({ ...prev, plan: planType }));
    setShowPlanModal(false);
    
    // Complete onboarding and redirect to content creation
    dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    
    if (onNext) {
      onNext({ ...formData, plan: planType });
    } else {
      navigate('/content');
    }
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform as any)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform as any]
    }));
  };

  const currentGoalOptions = formData.type === 'business' ? businessGoalOptions : individualGoalOptions;
  const currentIndustries = formData.type === 'business' ? industries : individualIndustries;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          {formData.type === 'business' ? (
            <Building2 className="w-8 h-8 text-blue-600" />
          ) : (
            <User className="w-8 h-8 text-blue-600" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Profile Setup</h2>
        <p className="text-gray-600">Tell us about your profile to create personalized content</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Type Selection */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                formData.type === 'individual'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'individual' }))}
            >
              <div className="flex items-center space-x-3">
                <User className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Individual</h3>
                  <p className="text-sm text-gray-600">Personal brand, creator, or influencer</p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                formData.type === 'business'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'business' }))}
            >
              <div className="flex items-center space-x-3">
                <Building2 className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Business</h3>
                  <p className="text-sm text-gray-600">Company, brand, or organization</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'business' ? (
                  <Building2 className="w-4 h-4 inline mr-2" />
                ) : (
                  <User className="w-4 h-4 inline mr-2" />
                )}
                {formData.type === 'business' ? 'Company Name' : 'Profile Name'} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder={formData.type === 'business' ? 'Enter your company name' : 'Enter your name or brand'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'business' ? 'Industry' : 'Category'}
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select your {formData.type === 'business' ? 'industry' : 'category'}</option>
                {currentIndustries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                {formData.type === 'business' ? 'Company' : 'Profile'} Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                rows={3}
                placeholder={formData.type === 'business' 
                  ? 'Describe what your company does, your mission, and values'
                  : 'Describe yourself, your niche, and what you create'
                }
              />
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Audience</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="w-4 h-4 inline mr-2" />
              Audience Description
            </label>
            <textarea
              value={formData.targetAudience}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              rows={3}
              placeholder={formData.type === 'business'
                ? 'Describe your target audience (age, interests, demographics, pain points)'
                : 'Describe your ideal followers (age, interests, what content they enjoy)'
              }
            />
          </div>
        </div>

        {/* Brand Voice */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <Palette className="w-5 h-5 inline mr-2" />
            {formData.type === 'business' ? 'Brand Voice & Tone' : 'Content Style & Tone'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {toneOptions.map(tone => (
              <div
                key={tone.value}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                  formData.brandTone === tone.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, brandTone: tone.value as any }))}
              >
                <h3 className="font-medium text-gray-900">{tone.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{tone.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <Goal className="w-5 h-5 inline mr-2" />
            {formData.type === 'business' ? 'Marketing Goals' : 'Content Goals'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {currentGoalOptions.map(goal => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  formData.goals.includes(goal)
                    ? 'bg-blue-500 text-white border-2 border-blue-500 shadow-md'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        {/* Social Media Platforms */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Target Platforms *
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformOptions.map(platform => {
              const IconComponent = platform.icon;
              const isSelected = formData.platforms.includes(platform.id as any);
              
              return (
                <div
                  key={platform.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? `border-blue-500 bg-blue-50 shadow-md`
                      : `border-gray-200 hover:border-gray-300 bg-white ${platform.bgColor}`
                  }`}
                  onClick={() => togglePlatform(platform.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-white'}`}>
                      <IconComponent className={`w-6 h-6 ${isSelected ? 'text-blue-600' : platform.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{platform.name}</h3>
                      <div className={`w-2 h-2 rounded-full mt-1 ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {formData.platforms.length === 0 && (
            <p className="text-sm text-red-600 mt-2">Please select at least one platform</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-100 text-gray-700 py-4 px-8 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={!formData.name || formData.platforms.length === 0}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-8 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {formData.type === 'individual' ? 'Continue to Plan Selection' : 'Continue to Content Creation'}
          </button>
        </div>
      </form>

      {/* Plan Selection Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                  <p className="text-gray-600">Select the perfect plan for your content creation needs</p>
                </div>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  className={`relative p-6 border-2 rounded-xl transition-all duration-200 hover:shadow-lg ${
                    key === 'ipro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  {key === 'ipro' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                        <Crown className="w-3 h-3 mr-1" />
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-1">/{plan.period}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-start">
                        <X className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{limitation}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePlanSelect(key as 'free' | 'ipro' | 'business')}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                      key === 'ipro'
                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {key === 'free' ? 'Start Free' : 'Get Started'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};