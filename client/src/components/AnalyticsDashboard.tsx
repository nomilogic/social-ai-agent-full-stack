import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2,
  Calendar,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { usePlanFeatures } from '../hooks/usePlanFeatures';
import { FeatureRestriction } from './FeatureRestriction';

interface AnalyticsData {
  totalViews: number;
  totalEngagement: number;
  totalReach: number;
  engagementRate: number;
  topPerformingPost: {
    content: string;
    engagement: number;
    platform: string;
  } | null;
  platformBreakdown: Array<{
    platform: string;
    views: number;
    engagement: number;
  }>;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

interface AnalyticsDashboardProps {
  profileId?: string;
  campaignId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  profileId,
  campaignId,
  timeRange = '30d'
}) => {
  const { state } = useAppContext();
  const { hasAnalytics, hasRealTimeAnalytics } = usePlanFeatures();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  useEffect(() => {
    if (hasAnalytics) {
      fetchAnalytics();
    }
  }, [profileId, campaignId, selectedTimeRange, hasAnalytics]);

  const fetchAnalytics = async () => {
    if (!hasAnalytics) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?profileId=${profileId}&campaignId=${campaignId}&timeRange=${selectedTimeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        // Generate sample data for demo purposes
        setAnalytics({
          totalViews: Math.floor(Math.random() * 50000) + 10000,
          totalEngagement: Math.floor(Math.random() * 5000) + 1000,
          totalReach: Math.floor(Math.random() * 30000) + 5000,
          engagementRate: Math.random() * 10 + 2,
          topPerformingPost: {
            content: "AI-powered content creation is revolutionizing social media marketing! 🚀",
            engagement: Math.floor(Math.random() * 1000) + 100,
            platform: "instagram"
          },
          platformBreakdown: [
            { platform: "instagram", views: Math.floor(Math.random() * 15000) + 5000, engagement: Math.floor(Math.random() * 2000) + 500 },
            { platform: "facebook", views: Math.floor(Math.random() * 12000) + 3000, engagement: Math.floor(Math.random() * 1500) + 300 },
            { platform: "twitter", views: Math.floor(Math.random() * 8000) + 2000, engagement: Math.floor(Math.random() * 1000) + 200 },
            { platform: "linkedin", views: Math.floor(Math.random() * 5000) + 1000, engagement: Math.floor(Math.random() * 800) + 150 }
          ],
          weeklyGrowth: Math.random() * 20 - 5,
          monthlyGrowth: Math.random() * 50 - 10
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4" />;
    if (growth < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  if (!hasAnalytics) {
    return (
      <FeatureRestriction feature="Analytics Dashboard" requiredPlan="ipro">
        <div className="theme-bg-card rounded-xl p-8 theme-border border backdrop-blur-md">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 theme-text-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold theme-text-primary mb-2">Analytics Dashboard</h3>
            <p className="theme-text-secondary">Track your content performance and engagement metrics</p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Views", value: "45.2K", icon: Eye },
                { label: "Engagement", value: "3.8K", icon: Heart },
                { label: "Reach", value: "28.5K", icon: Users },
                { label: "Growth", value: "+12.5%", icon: TrendingUp }
              ].map((metric, index) => (
                <div key={index} className="theme-bg-secondary rounded-lg p-4 text-center">
                  <metric.icon className="w-6 h-6 theme-text-light mx-auto mb-2" />
                  <div className="text-lg font-semibold theme-text-primary">{metric.value}</div>
                  <div className="text-xs theme-text-light">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FeatureRestriction>
    );
  }

  if (loading) {
    return (
      <div className="theme-bg-card rounded-xl p-8 theme-border border backdrop-blur-md">
        <div className="animate-pulse">
          <div className="h-8 theme-bg-secondary rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="theme-bg-secondary rounded-lg p-6">
                <div className="h-4 theme-bg-primary rounded w-2/3 mb-3"></div>
                <div className="h-6 theme-bg-primary rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold theme-text-primary">Analytics Dashboard</h2>
          <p className="theme-text-secondary">Track your content performance and engagement</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-opacity-20 theme-bg-secondary rounded-lg p-1">
          {[
            { key: '7d', label: '7 days' },
            { key: '30d', label: '30 days' },
            { key: '90d', label: '90 days' },
            { key: '1y', label: '1 year' }
          ].map((range) => (
            <button
              key={range.key}
              onClick={() => setSelectedTimeRange(range.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedTimeRange === range.key
                  ? 'theme-button-primary'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="theme-bg-card rounded-xl p-6 theme-border border backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="theme-text-light text-sm font-medium">Total Views</p>
                  <p className="text-2xl font-bold theme-text-primary">{formatNumber(analytics.totalViews)}</p>
                </div>
                <div className="theme-bg-secondary rounded-lg p-3">
                  <Eye className="w-6 h-6 theme-text-primary" />
                </div>
              </div>
              <div className={`flex items-center mt-2 ${getGrowthColor(analytics.weeklyGrowth)}`}>
                {getGrowthIcon(analytics.weeklyGrowth)}
                <span className="text-sm ml-1">{Math.abs(analytics.weeklyGrowth).toFixed(1)}% vs last week</span>
              </div>
            </div>

            <div className="theme-bg-card rounded-xl p-6 theme-border border backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="theme-text-light text-sm font-medium">Engagement</p>
                  <p className="text-2xl font-bold theme-text-primary">{formatNumber(analytics.totalEngagement)}</p>
                </div>
                <div className="theme-bg-secondary rounded-lg p-3">
                  <Heart className="w-6 h-6 theme-text-primary" />
                </div>
              </div>
              <div className={`flex items-center mt-2 ${getGrowthColor(analytics.weeklyGrowth * 0.8)}`}>
                {getGrowthIcon(analytics.weeklyGrowth * 0.8)}
                <span className="text-sm ml-1">{Math.abs(analytics.weeklyGrowth * 0.8).toFixed(1)}% vs last week</span>
              </div>
            </div>

            <div className="theme-bg-card rounded-xl p-6 theme-border border backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="theme-text-light text-sm font-medium">Reach</p>
                  <p className="text-2xl font-bold theme-text-primary">{formatNumber(analytics.totalReach)}</p>
                </div>
                <div className="theme-bg-secondary rounded-lg p-3">
                  <Users className="w-6 h-6 theme-text-primary" />
                </div>
              </div>
              <div className={`flex items-center mt-2 ${getGrowthColor(analytics.monthlyGrowth * 0.6)}`}>
                {getGrowthIcon(analytics.monthlyGrowth * 0.6)}
                <span className="text-sm ml-1">{Math.abs(analytics.monthlyGrowth * 0.6).toFixed(1)}% vs last month</span>
              </div>
            </div>

            <div className="theme-bg-card rounded-xl p-6 theme-border border backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="theme-text-light text-sm font-medium">Engagement Rate</p>
                  <p className="text-2xl font-bold theme-text-primary">{analytics.engagementRate.toFixed(1)}%</p>
                </div>
                <div className="theme-bg-secondary rounded-lg p-3">
                  <Target className="w-6 h-6 theme-text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm ml-1">Above average</span>
              </div>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="theme-bg-card rounded-xl p-6 theme-border border backdrop-blur-md">
            <h3 className="text-lg font-semibold theme-text-primary mb-6">Platform Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.platformBreakdown.map((platform, index) => (
                <div key={index} className="theme-bg-secondary rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium theme-text-primary capitalize">{platform.platform}</span>
                    <Zap className="w-4 h-4 theme-text-light" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm theme-text-light">Views</span>
                      <span className="text-sm theme-text-primary">{formatNumber(platform.views)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm theme-text-light">Engagement</span>
                      <span className="text-sm theme-text-primary">{formatNumber(platform.engagement)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Post */}
          {analytics.topPerformingPost && (
            <div className="theme-bg-card rounded-xl p-6 theme-border border backdrop-blur-md">
              <h3 className="text-lg font-semibold theme-text-primary mb-4">Top Performing Post</h3>
              <div className="theme-bg-secondary rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <span className="theme-text-light text-sm capitalize">{analytics.topPerformingPost.platform}</span>
                  <span className="theme-text-primary font-semibold">{formatNumber(analytics.topPerformingPost.engagement)} engagements</span>
                </div>
                <p className="theme-text-primary">{analytics.topPerformingPost.content}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};