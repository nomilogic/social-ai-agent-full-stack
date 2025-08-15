import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  BarChart3,
  Plus,
  Eye,
  Trash2,
  Edit,
} from "lucide-react";
import { PostScheduleDashboard } from "../components/PostScheduleDashboard";
import { PostCalendar } from "../components/PostCalendar";
import { AIScheduleGenerator } from "../components/AIScheduleGenerator";
import { useAppContext } from "../context/AppContext";
import { FeatureRestriction } from "../components/FeatureRestriction";
import { usePlanFeatures } from "../hooks/usePlanFeatures";

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledDate: Date;
  status: "scheduled" | "published" | "failed";
  imageUrl?: string;
}

export const SchedulePage: React.FC = () => {
  const { state } = useAppContext();
  const { canUseFeature } = usePlanFeatures();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "calendar" | "ai-generator"
  >("dashboard");
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canSchedulePosts = canUseFeature("ipro");

  useEffect(() => {
    const fetchScheduledPosts = async () => {
      if (!state.selectedProfile?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/schedule/posts?companyId=${state.selectedProfile.id}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch scheduled posts");
        }

        const data = await response.json();
        console.log("Scheduled posts data:", data);

        if (data.success && Array.isArray(data.data)) {
          const posts = data.data.map((post: any) => ({
            id: post.id,
            content: post.content,
            platforms: post.platforms || [],
            scheduledDate: new Date(post.scheduled_date),
            status: post.status,
            imageUrl: post.image_url,
          }));
          setScheduledPosts(posts);
        }
      } catch (error) {
        console.error("Error fetching scheduled posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScheduledPosts();
  }, [state.selectedProfile?.id]);

  const handleCreatePost = (date: Date) => {
    // Navigate to content creation with pre-filled date
    console.log('Creating post for date:', date);
    // Implementation to navigate to content page with scheduled date
  };

  const handleEditPost = (postId: string) => {
    console.log('Editing post:', postId);
    // Implementation to edit existing post
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/schedule/posts/${postId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setScheduledPosts(prev => prev.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleViewPost = (postId: string) => {
    console.log('Viewing post:', postId);
    // Implementation to view post details
  };

  if (!canSchedulePosts) {
    return (
      <FeatureRestriction
        feature="Schedule Posts"
        requiredPlan="ipro"
      >
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Schedule Posts</h2>
          <p className="text-gray-600">Schedule your content across multiple platforms with AI-powered optimal timing</p>
        </div>
      </FeatureRestriction>
    );
  }

  return (
    <div className="min-h-screen theme-gradient">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-600">Schedule your content across multiple platforms with AI-powered optimal timing</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "dashboard"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </div>
              </button>
              <button
                onClick={() => setActiveTab("calendar")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "calendar"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar
                </div>
              </button>
              <button
                onClick={() => setActiveTab("ai-generator")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "ai-generator"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  AI Generator
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "dashboard" && (
            <PostScheduleDashboard companyId={state.selectedProfile?.id || ""} />
          )}

          {activeTab === "calendar" && (
            <PostCalendar 
              scheduledPosts={scheduledPosts}
              onCreatePost={handleCreatePost}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onViewPost={handleViewPost}
              companyId={state.selectedProfile?.id || ""}
            />
          )}

          {activeTab === "ai-generator" && (
            <AIScheduleGenerator 
              onGenerateSchedule={async () => []}
              onApproveSchedule={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
};
