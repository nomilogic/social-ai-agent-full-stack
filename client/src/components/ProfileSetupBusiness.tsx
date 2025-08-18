import React, { useState } from 'react';
import { Crown, Building2, Users, Target, Briefcase, MapPin, Globe } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ProfileSetupBusinessProps {
  onComplete: () => void;
}

export const ProfileSetupBusiness: React.FC<ProfileSetupBusinessProps> = ({ onComplete }) => {
  const { state, dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    companySize: '',
    industry: '',
    targetAudience: '',
    brandVoice: '',
    businessGoals: [] as string[],
    preferredPlatforms: [] as string[],
    teamCollaboration: false,
    customIntegrations: [] as string[],
    monthlyBudget: '',
    contentVolume: ''
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleArrayChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field as keyof typeof prev] as string[]), value]
        : (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profileData = {
        type: 'business',
        plan: 'business',
        ...formData,
        userId: state.user?.id
      };

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
      dispatch({ type: 'SET_SELECTED_PROFILE', payload: profileData as any });
      dispatch({ type: 'SET_BUSINESS_ACCOUNT', payload: true });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Profile setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const businessGoalOptions = [
    'Increase brand awareness',
    'Generate leads',
    'Drive website traffic',
    'Build community',
    'Customer support',
    'Thought leadership',
    'Product launches',
    'Market research',
    'Crisis management',
    'Employee advocacy'
  ];

  const platformOptions = [
    'LinkedIn',
    'Facebook',
    'Twitter',
    'Instagram',
    'YouTube',
    'TikTok'
  ];

  const integrationOptions = [
    'CRM Systems',
    'Email Marketing',
    'Analytics Tools',
    'Project Management',
    'Customer Support',
    'E-commerce',
    'Marketing Automation',
    'HR Systems'
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Retail',
    'Manufacturing',
    'Education',
    'Real Estate',
    'Consulting',
    'Legal',
    'Non-profit',
    'Media',
    'Other'
  ];

  const brandVoices = [
    'Professional',
    'Authoritative',
    'Friendly',
    'Innovative',
    'Trustworthy',
    'Dynamic',
    'Helpful',
    'Expert'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Business Profile</h2>
        <p className="text-gray-600 mt-2">
          Comprehensive setup for teams and enterprise-level social media management
        </p>
      </div>

      {/* Company Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          Company Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter business name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="City, Country"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Description *
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Describe your business and what you offer"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Website *
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://yourbusiness.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Industry *
            </label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select industry</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Company Size *
            </label>
            <select
              name="companySize"
              value={formData.companySize}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="501-1000">501-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand Voice</label>
            <select
              name="brandVoice"
              value={formData.brandVoice}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select brand voice</option>
              {brandVoices.map((voice) => (
                <option key={voice} value={voice}>{voice}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Business Strategy */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Business Strategy
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience *
          </label>
          <textarea
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleInputChange}
            required
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Describe your ideal customers and target market"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Content Volume</label>
            <select
              name="contentVolume"
              value={formData.contentVolume}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select volume</option>
              <option value="50-100">50-100 posts/month</option>
              <option value="100-250">100-250 posts/month</option>
              <option value="250-500">250-500 posts/month</option>
              <option value="500+">500+ posts/month</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Budget Range</label>
            <select
              name="monthlyBudget"
              value={formData.monthlyBudget}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select budget range</option>
              <option value="1000-5000">$1,000 - $5,000</option>
              <option value="5000-10000">$5,000 - $10,000</option>
              <option value="10000-25000">$10,000 - $25,000</option>
              <option value="25000+">$25,000+</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Business Goals (select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {businessGoalOptions.map((goal) => (
              <label key={goal} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.businessGoals.includes(goal)}
                  onChange={(e) => handleArrayChange('businessGoals', goal, e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{goal}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred Platforms (unlimited for Business plan)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {platformOptions.map((platform) => (
              <label key={platform} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preferredPlatforms.includes(platform)}
                  onChange={(e) => handleArrayChange('preferredPlatforms', platform, e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{platform}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Enterprise Features */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Enterprise Features</h3>

        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name="teamCollaboration"
              checked={formData.teamCollaboration}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Enable team collaboration features</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Required Integrations
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {integrationOptions.map((integration) => (
              <label key={integration} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.customIntegrations.includes(integration)}
                  onChange={(e) => handleArrayChange('customIntegrations', integration, e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{integration}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting up your business profile...' : 'Complete Business Setup'}
        </button>
      </div>
    </form>
  );
};
