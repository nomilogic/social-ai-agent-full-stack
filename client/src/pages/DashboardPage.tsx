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
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

export const DashboardPage: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

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
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-1 rounded-full">
              {onboardingStep + 1}/{onboardingSteps.length}
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentStep.title}
            </h1>
            <p className="text-lg text-gray-600">{currentStep.description}</p>
            <p className="text-gray-700 text-sm leading-relaxed max-w-md mx-auto">
              {currentStep.content}
            </p>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={skipOnboarding}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Skip for now
            </button>
            <button
              onClick={nextOnboardingStep}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
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
                  index === onboardingStep ? "bg-blue-600" : "bg-gray-300"
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
      color: "bg-blue-600",
      action: () => navigate("/content"),
    },
    {
      title: "Manage Companies",
      description: "Add or edit your company profiles",
      icon: TrendingUp,
      color: "bg-green-600",
      action: () => navigate("/companies"),
    },
    {
      title: "Schedule Posts",
      description: "Plan and schedule your content",
      icon: Calendar,
      color: "bg-purple-600",
      action: () => navigate("/schedule"),
    },
    {
      title: "Settings",
      description: "Configure your preferences",
      icon: Settings,
      color: "bg-gray-600",
      action: () => navigate("/settings"),
    },
  ];

  return (
    <div className="bg-black/10">
      <div className="bg-transparent">
        <div className="container mx-auto px-4 py-4 space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">
              Dashboard
            </h1>
            <p className="text-white/80 text-sm drop-shadow">
              Welcome back! Here's your content overview.
            </p>
          </div>

          {/* Create Content Button - Centered */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate("/content")}
              className="flex items-center gap-2 bg-black/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg hover:bg-black/30 transition-all duration-200 pulse-glow border border-white/20"
            >
              <Plus className="w-5 h-5" />
              <span className="text-base font-medium">Create Content</span>
            </button>
          </div>

          {/* Stats Overview - 2 Columns Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-4 floating-element">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white/80">
                    Total Posts
                  </h3>
                  <p className="text-2xl font-bold text-white mt-1 drop-shadow">
                    24
                  </p>
                  <p className="text-green-300 text-xs">
                    +12% from last month
                  </p>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            
            <div
              className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-4 floating-element"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white/80">
                    Scheduled
                  </h3>
                  <p className="text-2xl font-bold text-white mt-1 drop-shadow">
                    8
                  </p>
                  <p className="text-orange-200 text-xs">
                    Next post in 2 hours
                  </p>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
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
                  className="bg-black/20 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 floating-element"
                >
                  <div
                    className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center mb-3`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {action.title}
                  </h3>
                  <p className="text-white/70 text-xs leading-tight">{action.description}</p>
                </div>
              );
            })}
          </div>

          {/* Show onboarding again button if no companies */}
          {!state.selectedCompany && (
            <div className="bg-black/20 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-4 text-center floating-element">
              <h2 className="text-lg font-bold text-white mb-2">
                Get Started with Your First Content
              </h2>
              <p className="text-white/80 text-sm mb-4">
                Create your company profile to unlock AI-powered content
                generation tailored to your brand.
              </p>
              <button
                onClick={() => setShowOnboarding(true)}
                className="bg-black/20 backdrop-blur-sm text-white px-6 py-2 text-sm rounded-lg hover:bg-black/30 transition-colors duration-200 border border-white/20"
              >
                Show Getting Started Guide
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
