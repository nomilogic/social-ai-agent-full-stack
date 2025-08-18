import React, { useState } from 'react';
import { User, MapPin, Globe } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ProfileSetupFreeProps {
  onComplete: () => void;
}

export const ProfileSetupFree: React.FC<ProfileSetupFreeProps> = ({ onComplete }) => {
  const { state, dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    contentNiche: '',
    preferredPlatforms: [] as string[]
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
        plan: 'free',
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

  const platformOptions = [
    'Instagram',
    'Facebook', 
    'Twitter',
    'LinkedIn'
  ];

  const niches = [
    'Lifestyle',
    'Technology', 
    'Business',
    'Health & Fitness',
    'Travel',
    'Food',
    'Fashion',
    'Education'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Free Creator Profile</h2>
        <p className="text-gray-600 mt-2">
          Set up your basic profile to get started with AI content creation
        </p>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="https://yourwebsite.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Content Niche</label>
          <select
            name="contentNiche"
            value={formData.contentNiche}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select your niche</option>
            {niches.map((niche) => (
              <option key={niche} value={niche}>{niche}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred Platforms (select up to 1 for Free plan)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {platformOptions.map((platform) => (
              <label key={platform} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="preferredPlatform"
                  checked={formData.preferredPlatforms.includes(platform)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        preferredPlatforms: [platform]
                      }));
                    }
                  }}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{platform}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting up your profile...' : 'Complete Free Setup'}
        </button>
      </div>
    </form>
  );
};
