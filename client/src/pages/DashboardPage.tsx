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
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 bg-blue-100 text-blue-600 text-sm font-semibold px-3 py-1 rounded-full">
              {onboardingStep + 1}/{onboardingSteps.length}
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {currentStep.title}
            </h1>
            <p className="text-xl text-gray-600">{currentStep.description}</p>
            <p className="text-gray-700 leading-relaxed max-w-lg mx-auto">
              {currentStep.content}
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={skipOnboarding}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Skip for now
            </button>
            <button
              onClick={nextOnboardingStep}
              className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <span>
                {onboardingStep === onboardingSteps.length - 1
                  ? "Get Started"
                  : "Next"}
              </span>
              <ArrowRight className="w-4 h-4" />
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
    <div className="min-h-screen bg-black/10">
      <div className="min-h-screen bg-transparent ">
        <div className="container mx-auto px-6 py-8 space-y-8">
          <div className="flex justify-between items-center flex-col">
            <div className="">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg text-center">
                Dashboard
              </h1>
              <p className="text-white/80 mt-1 mb-3 drop-shadow">
                Welcome back! Here's your content overview.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/content")}
                className="flex items-center bg-black/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl w-[100%] hover:bg-black/30 transition-all duration-200 pulse-glow border border-white/20 "
              >
                <Plus className="w-5 h-5 " />
                <span>Create Content</span>
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 p-6 floating-element">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Total Posts
                  </h3>
                  <p className="text-3xl font-bold text-white mt-2 drop-shadow">
                    24
                  </p>
                  <p className="text-green-300 text-sm mt-1">
                    +12% from last month
                  </p>
                </div>
                <div className="bg-black/20 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div
              className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 p-6 floating-element"
              style={{ animationDelay: "10.5s" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Scheduled
                  </h3>
                  <p className="text-3xl font-bold text-white mt-2 drop-shadow">
                    8
                  </p>
                  <p className="text-orange-200 text-sm mt-1">
                    Next post in 2 hours
                  </p>
                </div>
                <div className="bg-black/20 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div
              className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 p-6 floating-element"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Engagement
                  </h3>
                  <p className="text-3xl font-bold text-white mt-2 drop-shadow">
                    94.2%
                  </p>
                  <p className="text-purple-200 text-sm mt-1">+5.1% increase</p>
                </div>
                <div className="bg-black/20 p-3 rounded-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={index}
                  onClick={action.action}
                  className="bg-black/20 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 floating-element"
                >
                  <div
                    className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-white/80 text-sm">{action.description}</p>
                </div>
              );
            })}
          </div>

          {/* Show onboarding again button if no companies */}
          {!state.selectedCompany && (
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-8 text-center floating-element">
              <h2 className="text-2xl font-bold text-white mb-4">
                Get Started with Your First Content
              </h2>
              <p className="text-white/80 mb-6">
                Create your company profile to unlock AI-powered content
                generation tailored to your brand.
              </p>
              <button
                onClick={() => setShowOnboarding(true)}
                className="bg-black/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg hover:bg-black/30 transition-colors duration-200 border border-white/20"
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
