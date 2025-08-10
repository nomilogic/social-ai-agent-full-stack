import React, { useState, useEffect } from 'react';
import { Target, BarChart3, Share2, Settings, Plus, Edit2, Calendar, TrendingUp, Users, Clock, CheckCircle2, AlertTriangle, Play, Pause } from 'lucide-react';
import { Campaign } from '../types';

interface CampaignDashboardProps {
  campaign: Campaign;
  onEditCampaign: () => void;
  onCreatePost: () => void;
  onViewPosts: () => void;
  onBack: () => void;
}

interface CampaignStats {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
  totalReach: number;
  totalEngagement: number;
  engagementRate: number;
  recentActivity: ActivityItem[];
  platformBreakdown: { [platform: string]: number };
  performanceMetrics: {
    impressions: number;
    clicks: number;
    shares: number;
    comments: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'post_published' | 'post_scheduled' | 'engagement_spike' | 'milestone_reached';
  message: string;
  timestamp: string;
  platform?: string;
}

type DashboardView = 'overview' | 'posts' | 'analytics' | 'settings';

export const CampaignDashboard: React.FC<CampaignDashboardProps> = ({
  campaign,
  onEditCampaign,
  onCreatePost,
  onViewPosts,
  onBack
}) => {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaignStats();
  }, [campaign.id]);

  const loadCampaignStats = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockStats: CampaignStats = {
        totalPosts: campaign.totalPosts || 24,
        publishedPosts: campaign.publishedPosts || 18,
        scheduledPosts: campaign.scheduledPosts || 6,
        draftPosts: 3,
        totalReach: 12500,
        totalEngagement: 1850,
        engagementRate: 4.8,
        platformBreakdown: {
          linkedin: 45,
          twitter: 30,
          facebook: 15,
          instagram: 10
        },
        performanceMetrics: {
          impressions: 45000,
          clicks: 2800,
          shares: 320,
          comments: 180
        },
        recentActivity: [
          {
            id: '1',
            type: 'post_published',
            message: 'Campaign post published on LinkedIn',
            timestamp: '3 hours ago',
            platform: 'linkedin'
          },
          {
            id: '2',
            type: 'engagement_spike',
            message: 'Post receiving high engagement',
            timestamp: '1 day ago',
            platform: 'twitter'
          },
          {
            id: '3',
            type: 'milestone_reached',
            message: 'Campaign reached 1000 total engagements',
            timestamp: '2 days ago'
          },
          {
            id: '4',
            type: 'post_scheduled',
            message: 'New post scheduled for tomorrow',
            timestamp: '3 days ago'
          }
        ]
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading campaign stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Campaign['status']) => {
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update would be handled by parent component
        console.log('Status updated to:', newStatus);
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
    }
  };

  const NavigationTabs = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => setActiveView('overview')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          activeView === 'overview'
            ? 'bg-white text-purple-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Target className="w-4 h-4" />
        Overview
      </button>
      
      <button
        onClick={() => setActiveView('posts')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          activeView === 'posts'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Share2 className="w-4 h-4" />
        Posts
      </button>

      <button
        onClick={() => setActiveView('analytics')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          activeView === 'analytics'
            ? 'bg-white text-green-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        Analytics
      </button>

      <button
        onClick={() => setActiveView('settings')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          activeView === 'settings'
            ? 'bg-white text-orange-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Settings className="w-4 h-4" />
        Settings
      </button>
    </div>
  );

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

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'post_published':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'post_scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'engagement_spike':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'milestone_reached':
        return <Target className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
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

  const OverviewView = () => {
    if (!stats) return <div>Loading overview...</div>;

    return (
      <div className="space-y-6">
        {/* Campaign Status and Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(campaign.status)}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </div>
              {campaign.startDate && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(campaign.startDate).toLocaleDateString()}
                  {campaign.endDate && ` - ${new Date(campaign.endDate).toLocaleDateString()}`}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {campaign.status === 'active' ? (
                <button
                  onClick={() => handleStatusUpdate('paused')}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  Pause Campaign
                </button>
              ) : campaign.status === 'paused' ? (
                <button
                  onClick={() => handleStatusUpdate('active')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Resume Campaign
                </button>
              ) : null}
              
              <button
                onClick={onEditCampaign}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Campaign
              </button>
            </div>
          </div>
          
          {campaign.description && (
            <p className="text-gray-700 mb-4">{campaign.description}</p>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Posts</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPosts}</p>
            <p className="text-sm text-green-600 mt-1">+{stats.scheduledPosts} scheduled</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Published</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.publishedPosts}</p>
            <p className="text-sm text-blue-600 mt-1">{stats.draftPosts} drafts</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Reach</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalReach.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">+15% this week</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Engagement Rate</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.engagementRate}%</p>
            <p className="text-sm text-green-600 mt-1">+0.3% vs last week</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={onCreatePost}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
            >
              <Plus className="w-6 h-6 text-blue-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Create Post</div>
                <div className="text-sm text-gray-600">Add content to campaign</div>
              </div>
            </button>

            <button
              onClick={onViewPosts}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
            >
              <Share2 className="w-6 h-6 text-purple-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">View Posts</div>
                <div className="text-sm text-gray-600">Manage campaign content</div>
              </div>
            </button>

            <button
              onClick={() => setActiveView('analytics')}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200"
            >
              <BarChart3 className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">View Analytics</div>
                <div className="text-sm text-gray-600">Performance insights</div>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-600">{activity.timestamp}</p>
                  </div>
                  {activity.platform && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full capitalize">
                      {activity.platform}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Distribution</h3>
            <div className="space-y-4">
              {Object.entries(stats.platformBreakdown).map(([platform, percentage]) => (
                <div key={platform} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900 capitalize">{platform}</span>
                    <span className="text-gray-600">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PostsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Campaign Posts</h3>
          <button
            onClick={onCreatePost}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Post
          </button>
        </div>
        <div className="text-center py-12">
          <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Campaign Content</h4>
          <p className="text-gray-600 mb-4">View and manage all posts in this campaign.</p>
          <button
            onClick={onViewPosts}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            View All Posts
          </button>
        </div>
      </div>
    </div>
  );

  const AnalyticsView = () => {
    if (!stats) return <div>Loading analytics...</div>;

    return (
      <div className="space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-500">Impressions</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.performanceMetrics.impressions.toLocaleString()}</p>
            <p className="text-sm text-green-600">+12% vs last period</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-medium text-gray-500">Clicks</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.performanceMetrics.clicks.toLocaleString()}</p>
            <p className="text-sm text-green-600">+8% vs last period</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Share2 className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-medium text-gray-500">Shares</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.performanceMetrics.shares.toLocaleString()}</p>
            <p className="text-sm text-red-600">-2% vs last period</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-orange-600" />
              <h3 className="text-sm font-medium text-gray-500">Comments</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.performanceMetrics.comments.toLocaleString()}</p>
            <p className="text-sm text-green-600">+15% vs last period</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics Coming Soon</h4>
            <p className="text-gray-600">Detailed performance charts and insights will be available here.</p>
          </div>
        </div>
      </div>
    );
  };

  const SettingsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Campaign Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <div className="p-3 bg-gray-50 rounded-lg">{campaign.name}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">{getObjectiveIcon(campaign.objective)}</span>
                <span className="capitalize">{campaign.objective}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(campaign.status)}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'Not set'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Not set'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platforms</label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                {campaign.platforms?.map((platform) => (
                  <span key={platform} className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full capitalize">
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {campaign.description && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <div className="p-3 bg-gray-50 rounded-lg">{campaign.description}</div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onEditCampaign}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Campaign Details
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Target className="w-8 h-8 animate-pulse text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading campaign dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">{getObjectiveIcon(campaign.objective)}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              <p className="text-gray-600 capitalize">{campaign.objective} Campaign</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Campaigns
          </button>
        </div>
      </div>

      {/* Navigation */}
      <NavigationTabs />

      {/* Main Content */}
      <div className="min-h-[600px]">
        {activeView === 'overview' && <OverviewView />}
        {activeView === 'posts' && <PostsView />}
        {activeView === 'analytics' && <AnalyticsView />}
        {activeView === 'settings' && <SettingsView />}
      </div>
    </div>
  );
};
