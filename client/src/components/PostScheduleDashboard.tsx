import React, { useState, useEffect } from 'react';
import { PostCalendar } from './PostCalendar';
import { AIScheduleGenerator } from './AIScheduleGenerator';
import { ContentInput } from './ContentInput';
import { scheduleService, scheduleUtils, type ScheduleRequest, type GeneratedSchedule, type ScheduledPost } from '../lib/scheduleService';
import { Calendar, Plus, BarChart3, Settings, Sparkles, Clock } from 'lucide-react';

interface PostScheduleDashboardProps {
  companyId: string;
  companyData?: any;
}

type ActiveView = 'calendar' | 'generator' | 'analytics' | 'create';

export const PostScheduleDashboard: React.FC<PostScheduleDashboardProps> = ({
  companyId,
  companyData
}) => {
  const [activeView, setActiveView] = useState<ActiveView>('calendar');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load scheduled posts on component mount
  useEffect(() => {
    loadScheduledPosts();
    loadAnalytics();
  }, [companyId]);

  const loadScheduledPosts = async () => {
    try {
      setLoading(true);
      const posts = await scheduleService.getScheduledPosts(companyId);
      setScheduledPosts(posts);
    } catch (error) {
      console.error('Failed to load scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await scheduleService.getSchedulingAnalytics(companyId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleGenerateSchedule = async (request: ScheduleRequest): Promise<GeneratedSchedule[]> => {
    try {
      setIsGeneratingSchedule(true);
      const schedule = await scheduleService.generateSchedule({
        ...request,
        companyId
      });
      return schedule;
    } catch (error) {
      console.error('Failed to generate schedule:', error);
      throw error;
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const handleApproveSchedule = async (schedule: GeneratedSchedule[]) => {
    try {
      await scheduleService.saveSchedule(schedule);
      await loadScheduledPosts();
      await loadAnalytics();
      setActiveView('calendar');
    } catch (error) {
      console.error('Failed to save schedule:', error);
    }
  };

  const handleCreatePost = (date: Date) => {
    setSelectedDate(date);
    setActiveView('create');
  };

  const handleEditPost = async (post: ScheduledPost) => {
    // For now, we'll implement this as switching to create view with pre-filled data
    setSelectedDate(new Date(post.date));
    setActiveView('create');
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await scheduleService.deleteScheduledPost(postId);
      await loadScheduledPosts();
      await loadAnalytics();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleViewPost = (post: ScheduledPost) => {
    // The PostPreview modal in PostCalendar handles this
  };

  const handleCreateScheduledPost = async (postData: any) => {
    try {
      if (!selectedDate) return;

      const newPost: Omit<ScheduledPost, 'id' | 'createdAt' | 'updatedAt'> = {
        date: scheduleUtils.formatDate(selectedDate),
        time: postData.scheduledTime || '09:00',
        content: postData.content,
        imageUrl: postData.imageUrl,
        platform: postData.platforms || ['linkedin'],
        status: 'scheduled',
        category: postData.category,
        companyId,
        isLive: false
      };

      await scheduleService.createScheduledPost(newPost);
      await loadScheduledPosts();
      await loadAnalytics();
      setActiveView('calendar');
      setSelectedDate(null);
    } catch (error) {
      console.error('Failed to create scheduled post:', error);
    }
  };

  const NavigationTabs = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => setActiveView('calendar')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          activeView === 'calendar'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Calendar className="w-4 h-4" />
        Calendar
      </button>
      
      <button
        onClick={() => setActiveView('generator')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          activeView === 'generator'
            ? 'bg-white text-purple-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        AI Generator
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
        onClick={() => setActiveView('create')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          activeView === 'create'
            ? 'bg-white text-orange-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Plus className="w-4 h-4" />
        Create Post
      </button>
    </div>
  );

  const AnalyticsView = () => {
    if (!analytics) return <div>Loading analytics...</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Scheduled</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalScheduled}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Published</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalPublished}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Failed</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalFailed}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Success Rate</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {analytics.totalPublished + analytics.totalFailed > 0 
                ? Math.round((analytics.totalPublished / (analytics.totalPublished + analytics.totalFailed)) * 100)
                : 0}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Posts by Platform</h3>
            <div className="space-y-3">
              {Object.entries(analytics.postsByPlatform || {}).map(([platform, count]) => (
                <div key={platform} className="flex justify-between items-center">
                  <span className="capitalize text-gray-700">{platform}</span>
                  <span className="font-semibold text-gray-900">{count as number}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Posts by Category</h3>
            <div className="space-y-3">
              {Object.entries(analytics.postsByCategory || {}).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="capitalize text-gray-700">{category || 'General'}</span>
                  <span className="font-semibold text-gray-900">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Posts</h3>
          <div className="space-y-3">
            {analytics.upcomingPosts?.slice(0, 5).map((post: ScheduledPost) => (
              <div key={post.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 truncate">{post.content.slice(0, 60)}...</p>
                  <p className="text-sm text-gray-600">
                    {new Date(post.date).toLocaleDateString()} at {scheduleUtils.formatTime(post.time)}
                  </p>
                </div>
                <div className="flex gap-1">
                  {post.platform.map(platform => (
                    <span key={platform} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your post schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Post Schedule Manager</h1>
          <p className="text-gray-600 mt-1">
            Plan, schedule, and manage your social media content with AI assistance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {analytics && (
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{analytics.totalScheduled}</p>
              <p className="text-sm text-gray-600">Posts Scheduled</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <NavigationTabs />

      {/* Main Content */}
      <div className="min-h-[600px]">
        {activeView === 'calendar' && (
          <PostCalendar
            scheduledPosts={scheduledPosts}
            onCreatePost={handleCreatePost}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onViewPost={handleViewPost}
            companyId={companyId}
          />
        )}

        {activeView === 'generator' && (
          <AIScheduleGenerator
            onGenerateSchedule={handleGenerateSchedule}
            onApproveSchedule={handleApproveSchedule}
            companyData={companyData}
            isGenerating={isGeneratingSchedule}
          />
        )}

        {activeView === 'analytics' && <AnalyticsView />}

        {activeView === 'create' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Scheduled Post</h2>
              {selectedDate && (
                <p className="text-gray-600">
                  Scheduled for: {selectedDate.toLocaleDateString()}
                </p>
              )}
            </div>
            
            <ContentInput
              onGenerate={handleCreateScheduledPost}
              companyData={companyData}
              initialPlatforms={['linkedin']}
              showScheduling={true}
              scheduledDate={selectedDate}
            />
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setActiveView('calendar');
                  setSelectedDate(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
