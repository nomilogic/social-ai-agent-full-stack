import React, { useState, useEffect } from 'react';
import { Target, Plus, Calendar, BarChart3, Edit2, Trash2, Play, Pause, CheckCircle2 } from 'lucide-react';
import { Campaign } from '../types';

interface CampaignSelectorProps {
  companyId: string;
  onSelectCampaign: (campaign: Campaign) => void;
  onCreateNew: () => void;
  onEditCampaign: (campaign: Campaign) => void;
}

export const CampaignSelector: React.FC<CampaignSelectorProps> = ({
  companyId,
  onSelectCampaign,
  onCreateNew,
  onEditCampaign
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadCampaigns();
  }, [companyId]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (campaignId: string, newStatus: Campaign['status']) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setCampaigns(prev =>
          prev.map(campaign =>
            campaign.id === campaignId ? { ...campaign, status: newStatus } : campaign
          )
        );
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
    }
  };

  const handleDelete = async (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this campaign? This will not delete associated posts.')) {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
        }
      } catch (error) {
        console.error('Error deleting campaign:', error);
      }
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getObjectiveIcon = (objective?: string) => {
    switch (objective) {
      case 'awareness':
        return '👁️';
      case 'engagement':
        return '💬';
      case 'conversions':
        return '🎯';
      case 'leads':
        return '🔗';
      case 'sales':
        return '💰';
      default:
        return '🚀';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'all') return true;
    return campaign.status === filter;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Campaign</h2>
        <p className="text-gray-600">Choose a campaign or create a new one to organize your content</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex justify-center space-x-2">
          {[
            { key: 'all', label: 'All Campaigns' },
            { key: 'active', label: 'Active' },
            { key: 'paused', label: 'Paused' },
            { key: 'draft', label: 'Drafts' },
            { key: 'completed', label: 'Completed' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Campaign Card */}
        <div
          onClick={onCreateNew}
          className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
        >
          <Plus className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">Create New Campaign</h3>
          <p className="text-sm text-gray-600">Start a new marketing campaign</p>
        </div>

        {/* Existing Campaigns */}
        {filteredCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="border border-gray-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-md transition-all duration-200 relative group cursor-pointer"
            onClick={() => onSelectCampaign(campaign)}
          >
            {/* Actions Menu */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCampaign(campaign);
                }}
                className="p-1 text-gray-500 hover:text-blue-600"
                title="Edit campaign"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              
              {campaign.status === 'active' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate(campaign.id!, 'paused');
                  }}
                  className="p-1 text-gray-500 hover:text-yellow-600"
                  title="Pause campaign"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : campaign.status === 'paused' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate(campaign.id!, 'active');
                  }}
                  className="p-1 text-gray-500 hover:text-green-600"
                  title="Resume campaign"
                >
                  <Play className="w-4 h-4" />
                </button>
              ) : null}
              
              <button
                onClick={(e) => handleDelete(campaign.id!, e)}
                className="p-1 text-gray-500 hover:text-red-600"
                title="Delete campaign"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Campaign Header */}
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getObjectiveIcon(campaign.objective)}</span>
                  <h3 className="font-semibold text-gray-900 text-lg">{campaign.name}</h3>
                </div>
              </div>
              
              <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(campaign.status)}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </div>
            </div>

            {/* Campaign Description */}
            {campaign.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {campaign.description}
              </p>
            )}

            {/* Campaign Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {campaign.totalPosts || 0}
                </div>
                <div className="text-xs text-gray-600">Total Posts</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {campaign.publishedPosts || 0}
                </div>
                <div className="text-xs text-gray-600">Published</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {campaign.scheduledPosts || 0}
                </div>
                <div className="text-xs text-gray-600">Scheduled</div>
              </div>
            </div>

            {/* Campaign Dates */}
            {(campaign.startDate || campaign.endDate) && (
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  {campaign.startDate && new Date(campaign.startDate).toLocaleDateString()}
                  {campaign.startDate && campaign.endDate && ' - '}
                  {campaign.endDate && new Date(campaign.endDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Platforms */}
            <div className="flex flex-wrap gap-1 mb-4">
              {campaign.platforms?.slice(0, 3).map((platform) => (
                <span
                  key={platform}
                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full capitalize"
                >
                  {platform}
                </span>
              ))}
              {campaign.platforms && campaign.platforms.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{campaign.platforms.length - 3} more
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCampaign(campaign);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Create Post
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Add analytics view
                }}
                className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-1"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCampaigns.length === 0 && filter !== 'all' && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {filter} campaigns</h3>
          <p className="text-gray-600">You don't have any campaigns with this status.</p>
        </div>
      )}
    </div>
  );
};
