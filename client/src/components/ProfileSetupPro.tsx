import React, { useState } from 'react';
import { Zap, User, MapPin, Globe, Target } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ProfileSetupProProps {
  onComplete: () => void;
}

export const ProfileSetupPro: React.FC<ProfileSetupProProps> = ({ onComplete }) => {
  const { state, dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    contentNiche: '',
    socialGoals: [] as string[],
    postingFrequency: '',
    preferredPlatforms: [] as string[],
    targetAudience: '',
    brandVoice: ''
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
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
        type: 'individual',
        plan: 'ipro',
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

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Profile setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const socialGoalOptions = [
    'Grow followers',
    'Increase engagement',
    'Build personal brand',
    'Share expertise',
    'Network with others',
    'Monetize content',
    'Drive traffic',
    'Generate leads'
  ];

  const platformOptions = [
    'Instagram',
    'Facebook',
    'Twitter',
    'LinkedIn',
    'TikTok',
    'YouTube'
  ];

  const niches = [
    'Lifestyle',
    'Technology',
    'Business',
    'Health & Fitness',
    'Travel',
    'Food',
    'Fashion',
    'Education',
    'Entertainment',
    'Art & Design'
  ];

  const brandVoices = [
    'Professional',
    'Casual',
    'Funny',
    'Inspirational',
    'Educational',
    'Friendly',
    'Authoritative',
    'Creative'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Pro Creator Profile</h2>
        <p className="text-gray-600 mt-2">
          Advanced setup for professional content creators and influencers
        </p>
      </div>

      {/* Basic Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="City, Country"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about yourself and your content"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Globe className="w-4 h-4 inline mr-1" />
            Website
          </label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>

      {/* Content Strategy */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Content Strategy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Niche *</label>
            <select
              name="contentNiche"
              value={formData.contentNiche}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select your niche</option>
              {niches.map((niche) => (
                <option key={niche} value={niche}>{niche}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand Voice</label>
            <select
              name="brandVoice"
              value={formData.brandVoice}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select your voice</option>
              {brandVoices.map((voice) => (
                <option key={voice} value={voice}>{voice}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience
          </label>
          <textarea
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your ideal audience"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Posting Frequency</label>
          <select
            name="postingFrequency"
            value={formData.postingFrequency}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select frequency</option>
            <option value="daily">Daily</option>
            <option value="few-times-week">Few times a week</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Social Media Goals (select up to 4)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {socialGoalOptions.map((goal) => (
              <label key={goal} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.socialGoals.includes(goal)}
                  onChange={(e) => {
                    if (e.target.checked && formData.socialGoals.length < 4) {
                      handleArrayChange('socialGoals', goal, true);
                    } else if (!e.target.checked) {
                      handleArrayChange('socialGoals', goal, false);
                    }
                  }}
                  disabled={!formData.socialGoals.includes(goal) && formData.socialGoals.length >= 4}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{goal}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred Platforms (select up to 3)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {platformOptions.map((platform) => (
              <label key={platform} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preferredPlatforms.includes(platform)}
                  onChange={(e) => {
                    if (e.target.checked && formData.preferredPlatforms.length < 3) {
                      handleArrayChange('preferredPlatforms', platform, true);
                    } else if (!e.target.checked) {
                      handleArrayChange('preferredPlatforms', platform, false);
                    }
                  }}
                  disabled={!formData.preferredPlatforms.includes(platform) && formData.preferredPlatforms.length >= 3}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{platform}</span>
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
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting up your profile...' : 'Complete Pro Setup'}
        </button>
      </div>
    </form>
  );
};
