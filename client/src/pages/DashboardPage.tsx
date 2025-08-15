import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  TrendingUp,
  Calendar,
  Settings,
  ArrowRight,
  Sparkles,
  Target,
  Users,
  BarChart3,
  FileText,
  CheckCircle,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

export const DashboardPage: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Mock stats for demonstration
  const stats = {
    totalPosts: 24,
    scheduledPosts: 8,
    publishedPosts: 16,
    totalEngagement: 1500,
  };

  // Mock recent posts for demonstration
  const recentPosts = [
    { id: 1, content: "Excited to share our new product!", platform: "Twitter", date: "2 hours ago", status: "published" },
    { id: 2, content: "Upcoming webinar on AI trends", platform: "LinkedIn", date: "1 day ago", status: "scheduled" },
    { id: 3, content: "Behind the scenes: Our team at work", platform: "Instagram", date: "3 days ago", status: "published" },
    { id: 4, content: "New blog post: The Future of Social Media", platform: "Facebook", date: "5 days ago", status: "scheduled" },
  ];

  // Check if user needs onboarding (no companies yet)
  useEffect(() => {
    const checkOnboarding = async () => {
      if (state.user && !state.selectedCompany) {
        try {
          const response = await fetch(
            `/api/companies?userId=${state.user.id}`,
          );
          const companies = await response.json();
          if (companies.length === 0) {
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error("Error checking companies:", error);
        }
      }
    };

    checkOnboarding();
  }, [state.user, state.selectedCompany]);

  const onboardingSteps = [
    {
      title: "Welcome to Social AI Agent!",
      description: "Your AI-powered social media content creation platform",
      icon: Sparkles,
      content:
        "Transform your social media presence with AI-generated content tailored to your brand. Let's get you started in just a few simple steps.",
    },
    {
      title: "Create Your Company Profile",
      description: "Set up your brand identity and voice",
      icon: Target,
      content:
        "First, we'll create your company profile. This helps our AI understand your brand voice, target audience, and content preferences.",
    },
    {
      title: "Generate Your First Content",
      description: "Let AI create engaging posts for you",
      icon: Users,
      content:
        "Once your profile is ready, you can start generating AI-powered content. Our system creates posts optimized for different social media platforms.",
    },
    {
      title: "Publish & Schedule",
      description: "Share your content across platforms",
      icon: BarChart3,
      content:
        "Review, edit, and publish your content directly to your social media accounts or schedule them for optimal engagement times.",
    },
  ];

  const handleStartOnboarding = () => {
    navigate("/companies/new");
  };

  const nextOnboardingStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      handleStartOnboarding();
    }
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    const currentStep = onboardingSteps[onboardingStep];
    const Icon = currentStep.icon;

    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4 theme-gradient">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 theme-bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8 theme-text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 theme-bg-secondary theme-text-primary text-xs font-semibold px-2 py-1 rounded-full">
              {onboardingStep + 1}/{onboardingSteps.length}
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold theme-text-primary">
              {currentStep.title}
            </h1>
            <p className="text-lg theme-text-secondary">{currentStep.description}</p>
            <p className="theme-text-light text-sm leading-relaxed max-w-md mx-auto">
              {currentStep.content}
            </p>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={skipOnboarding}
              className="px-4 py-2 text-sm theme-text-secondary hover:theme-text-primary transition-colors duration-200"
            >
              Skip for now
            </button>
            <button
              onClick={nextOnboardingStep}
              className="flex items-center space-x-2 theme-button-primary text-white px-6 py-2 text-sm rounded-lg hover:theme-button-hover transition-colors duration-200"
            >
              <span>
                {onboardingStep === onboardingSteps.length - 1
                  ? "Get Started"
                  : "Next"}
              </span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  index === onboardingStep ? "theme-bg-primary" : "theme-bg-light"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Create Content",
      description: "Generate AI-powered social media posts",
      icon: Plus,
      color: "theme-bg-primary",
      action: () => navigate("/content"),
    },
    {
      title: "Manage Companies",
      description: "Add or edit your company profiles",
      icon: TrendingUp,
      color: "theme-bg-secondary",
      action: () => navigate("/companies"),
    },
    {
      title: "Schedule Posts",
      description: "Plan and schedule your content",
      icon: Calendar,
      color: "theme-bg-accent",
      action: () => navigate("/schedule"),
    },
    {
      title: "Settings",
      description: "Configure your preferences",
      icon: Settings,
      color: "theme-bg-light",
      action: () => navigate("/settings"),
    },
  ];

  return (
    <div className="theme-gradient min-h-screen">
      <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold theme-text-primary drop-shadow-lg">
            Dashboard
          </h1>
          <p className="theme-text-light text-sm drop-shadow">
            Welcome back! Here's your content overview.
          </p>
        </div>

        {/* Create Content Button - Centered */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/content")}
            className="flex items-center gap-2 theme-button-secondary text-white px-6 py-3 rounded-lg hover:theme-button-hover transition-all duration-200 pulse-glow border border-white/20"
          >
            <Plus className="w-5 h-5" />
            <span className="text-base font-medium">Create Content</span>
          </button>
        </div>

        {/* Stats Overview - 2 Columns Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="theme-bg-card rounded-xl border border-white/20 p-4 floating-element">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium theme-text-light">
                  Total Posts
                </h3>
                <p className="text-2xl font-bold theme-text-primary mt-1 drop-shadow">
                  {stats.totalPosts}
                </p>
                <p className="text-green-300 text-xs">
                  +12% from last month
                </p>
              </div>
              <div className="theme-bg-light p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 theme-text-primary" />
              </div>
            </div>
          </div>

          <div
            className="theme-bg-card rounded-xl border border-white/20 p-4 floating-element"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium theme-text-light">
                  Scheduled
                </h3>
                <p className="text-2xl font-bold theme-text-primary mt-1 drop-shadow">
                  {stats.scheduledPosts}
                </p>
                <p className="text-orange-200 text-xs">
                  Next post in 2 hours
                </p>
              </div>
              <div className="theme-bg-light p-2 rounded-lg">
                <Calendar className="w-5 h-5 theme-text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                onClick={action.action}
                className="theme-bg-card rounded-xl shadow-sm border border-white/20 p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 floating-element"
              >
                <div
                  className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center mb-3`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-semibold theme-text-primary mb-1">
                  {action.title}
                </h3>
                <p className="theme-text-light text-xs leading-tight">{action.description}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="theme-bg-card p-6 rounded-lg backdrop-blur-lg">
            <h2 className="text-xl font-semibold theme-text-primary mb-4">Recent Posts</h2>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start space-x-3 p-3 theme-bg-primary rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 theme-bg-secondary rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium theme-text-primary truncate">
                      {post.content}
                    </p>
                    <p className="text-sm theme-text-light">{post.platform} • {post.date}</p>
                  </div>
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                    post.status === 'published'
                      ? 'theme-bg-primary theme-text-primary'
                      : post.status === 'scheduled'
                      ? 'theme-bg-secondary theme-text-secondary'
                      : 'theme-bg-primary theme-text-light'
                  }`}>
                    {post.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="theme-bg-card p-6 rounded-lg backdrop-blur-lg">
            <h2 className="text-xl font-semibold theme-text-primary mb-4">Analytics Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 theme-bg-primary rounded-lg">
                <span className="text-sm font-medium theme-text-secondary">Impressions</span>
                <span className="text-sm font-bold theme-text-primary">24.5K</span>
              </div>
              <div className="flex justify-between items-center p-3 theme-bg-primary rounded-lg">
                <span className="text-sm font-medium theme-text-secondary">Clicks</span>
                <span className="text-sm font-bold theme-text-primary">1.2K</span>
              </div>
              <div className="flex justify-between items-center p-3 theme-bg-primary rounded-lg">
                <span className="text-sm font-medium theme-text-secondary">Engagement Rate</span>
                <span className="text-sm font-bold theme-text-primary">4.8%</span>
              </div>
              <div className="flex justify-between items-center p-3 theme-bg-primary rounded-lg">
                <span className="text-sm font-medium theme-text-secondary">Followers Growth</span>
                <span className="text-sm font-bold" style={{ color: 'var(--theme-accent)' }}>+127</span>
              </div>
            </div>
          </div>
        </div>

        {/* Show onboarding again button if no companies */}
        {!state.selectedCompany && (
          <div className="theme-bg-card rounded-xl shadow-sm border border-white/20 p-4 text-center floating-element">
            <h2 className="text-lg font-bold theme-text-primary mb-2">
              Get Started with Your First Content
            </h2>
            <p className="theme-text-light text-sm mb-4">
              Create your company profile to unlock AI-powered content
              generation tailored to your brand.
            </p>
            <button
              onClick={() => setShowOnboarding(true)}
              className="theme-button-secondary text-white px-6 py-2 text-sm rounded-lg hover:theme-button-hover transition-colors duration-200 border border-white/20"
            >
              Show Getting Started Guide
            </button>
          </div>
        )}
      </div>
    </div>
  );
};