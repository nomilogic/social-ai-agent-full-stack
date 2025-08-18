import React, { useState, useEffect } from "react";
import { Plus, Eye, Trash2, Edit } from "lucide-react";
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
    console.log("Creating post for date:", date);
    // Implementation to navigate to content page with scheduled date
  };

  const handleEditPost = (postId: string) => {
    console.log("Editing post:", postId);
    // Implementation to edit existing post
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/schedule/posts/${postId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setScheduledPosts((prev) => prev.filter((post) => post.id !== postId));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleViewPost = (postId: string) => {
    console.log("Viewing post:", postId);
    // Implementation to view post details
  };

  if (!canSchedulePosts) {
    return (
      <FeatureRestriction feature="Schedule Posts" requiredPlan="ipro">
        <div className="p-8 text-center">
          <p className="text-gray-600">
            Schedule your content across multiple platforms with AI-powered
            optimal timing
          </p>
        </div>
      </FeatureRestriction>
    );
  }

  return (
    <div className="min-h-screen theme-card-bg">
      <div className="">
        {/* Content */}
        <div className="space-y-6">
          <PostScheduleDashboard companyId={state.selectedProfile?.id || ""} />
        </div>
      </div>
    </div>
  );
};
