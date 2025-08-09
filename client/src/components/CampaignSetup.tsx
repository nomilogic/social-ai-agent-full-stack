import React, { useState } from 'react';
import { Target, Calendar, DollarSign, Users, Hash, ArrowLeft, Check } from 'lucide-react';
import { Campaign, Platform } from '../types';

interface CampaignSetupProps {
  companyId: string;
  onNext: (campaign: Campaign) => void;
  onBack: () => void;
  initialData?: Campaign;
}

const PLATFORMS: { id: Platform; name: string; color: string }[] = [
  { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-600' },
  { id: 'twitter', name: 'Twitter', color: 'bg-sky-400' },
  { id: 'instagram', name: 'Instagram', color: 'bg-pink-600' },
  { id: 'facebook', name: 'Facebook', color: 'bg-blue-700' },
  { id: 'tiktok', name: 'TikTok', color: 'bg-black' },
  { id: 'youtube', name: 'YouTube', color: 'bg-red-600' }
];

const OBJECTIVES: { id: Campaign['objective']; name: string; description: string; icon: string }[] = [
  { id: 'awareness', name: 'Brand Awareness', description: 'Increase visibility and reach', icon: '👁️' },
  { id: 'engagement', name: 'Engagement', description: 'Drive likes, comments, and shares', icon: '💬' },
  { id: 'conversions', name: 'Conversions', description: 'Drive specific actions', icon: '🎯' },
  { id: 'leads', name: 'Lead Generation', description: 'Collect leads and contacts', icon: '🔗' },
  { id: 'sales', name: 'Sales', description: 'Drive revenue and sales', icon: '💰' },
  { id: 'brand_building', name: 'Brand Building', description: 'Build brand reputation', icon: '🚀' }
];

export const CampaignSetup: React.FC<CampaignSetupProps> = ({
  companyId,
  onNext,
  onBack,
  initialData
}) => {
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    objective: initialData?.objective || 'awareness',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    targetAudience: initialData?.targetAudience || '',
    platforms: initialData?.platforms || [],
    budget: initialData?.budget || undefined,
    status: initialData?.status || 'active',
    brandVoice: initialData?.brandVoice || '',
    keywords: initialData?.keywords || [],
    hashtags: initialData?.hashtags || []
  });

  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentHashtag, setCurrentHashtag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Campaign name is required';
    }
    
    if (!formData.platforms || formData.platforms.length === 0) {
      newErrors.platforms = 'At least one platform is required';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const campaignData: Campaign = {
          ...initialData,
          ...formData,
          companyId,
          name: formData.name!,
          platforms: formData.platforms!,
        } as Campaign;

        const url = initialData?.id ? `/api/campaigns/${initialData.id}` : '/api/campaigns';
        const method = initialData?.id ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(initialData?.id ? campaignData : {
            company_id: companyId,
            name: formData.name,
            description: formData.description,
            objective: formData.objective,
            start_date: formData.startDate,
            end_date: formData.endDate,
            target_audience: formData.targetAudience,
            platforms: formData.platforms,
            budget: formData.budget,
            status: formData.status,
            brand_voice: formData.brandVoice,
            keywords: formData.keywords,
            hashtags: formData.hashtags
          }),
        });

        if (response.ok) {
          const savedCampaign = await response.json();
          onNext({
            id: savedCampaign.id,
            companyId: savedCampaign.company_id,
            name: savedCampaign.name,
            description: savedCampaign.description,
            objective: savedCampaign.objective,
            startDate: savedCampaign.start_date,
            endDate: savedCampaign.end_date,
            targetAudience: savedCampaign.target_audience,
            platforms: savedCampaign.platforms,
            budget: savedCampaign.budget,
            status: savedCampaign.status,
            brandVoice: savedCampaign.brand_voice,
            keywords: savedCampaign.keywords,
            hashtags: savedCampaign.hashtags,
            totalPosts: savedCampaign.total_posts,
            publishedPosts: savedCampaign.published_posts,
            scheduledPosts: savedCampaign.scheduled_posts,
            createdAt: savedCampaign.created_at,
            updatedAt: savedCampaign.updated_at
          });
        } else {
          const errorData = await response.json();
          setErrors({ submit: errorData.error || 'Failed to save campaign' });
        }
      } catch (error) {
        console.error('Error saving campaign:', error);
        setErrors({ submit: 'Failed to save campaign' });
      }
    }
  };

  const handlePlatformToggle = (platformId: Platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms?.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...(prev.platforms || []), platformId]
    }));
  };

  const addKeyword = () => {
    if (currentKeyword.trim() && !formData.keywords?.includes(currentKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), currentKeyword.trim()]
      }));
      setCurrentKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== keyword) || []
    }));
  };

  const addHashtag = () => {
    const hashtag = currentHashtag.trim().replace(/^#/, ''); // Remove # if user included it
    if (hashtag && !formData.hashtags?.includes(hashtag)) {
      setFormData(prev => ({
        ...prev,
        hashtags: [...(prev.hashtags || []), hashtag]
      }));
      setCurrentHashtag('');
    }
  };

  const removeHashtag = (hashtag: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags?.filter(h => h !== hashtag) || []
    }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {initialData ? 'Edit Campaign' : 'Create New Campaign'}
        </h2>
        <p className="text-gray-600">Set up your marketing campaign details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Summer Product Launch"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Campaign['status'] }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Describe your campaign goals and strategy..."
          />
        </div>

        {/* Campaign Objective */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Campaign Objective</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {OBJECTIVES.map((objective) => (
              <button
                key={objective.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, objective: objective.id }))}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.objective === objective.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{objective.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{objective.name}</h4>
                    <p className="text-sm text-gray-600">{objective.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Platforms <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => handlePlatformToggle(platform.id)}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  formData.platforms?.includes(platform.id)
                    ? `${platform.color} text-white border-transparent`
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className={`w-6 h-6 rounded-full mx-auto mb-2 ${
                  formData.platforms?.includes(platform.id) ? 'bg-white bg-opacity-30' : platform.color
                }`} />
                <span className="text-sm font-medium">{platform.name}</span>
              </button>
            ))}
          </div>
          {errors.platforms && <p className="text-red-500 text-sm mt-1">{errors.platforms}</p>}
        </div>

        {/* Campaign Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.endDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
          </div>
        </div>

        {/* Target Audience and Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Target Audience
            </label>
            <input
              type="text"
              value={formData.targetAudience}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Tech professionals, age 25-45"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Budget (Optional)
            </label>
            <input
              type="number"
              value={formData.budget || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                budget: e.target.value ? parseFloat(e.target.value) : undefined 
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Brand Voice */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Brand Voice
          </label>
          <input
            type="text"
            value={formData.brandVoice}
            onChange={(e) => setFormData(prev => ({ ...prev, brandVoice: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., professional, friendly, inspiring"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.keywords?.map((keyword) => (
              <span
                key={keyword}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentKeyword}
              onChange={(e) => setCurrentKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Add keywords..."
            />
            <button
              type="button"
              onClick={addKeyword}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Hashtags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Hash className="w-4 h-4 inline mr-2" />
            Hashtags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.hashtags?.map((hashtag) => (
              <span
                key={hashtag}
                className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                #{hashtag}
                <button
                  type="button"
                  onClick={() => removeHashtag(hashtag)}
                  className="ml-2 text-pink-600 hover:text-pink-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentHashtag}
              onChange={(e) => setCurrentHashtag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Add hashtags (without #)..."
            />
            <button
              type="button"
              onClick={addHashtag}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-8 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>{initialData ? 'Update Campaign' : 'Create Campaign'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
