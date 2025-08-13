
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Target, Users, BarChart3, Calendar, Zap, Brain, Camera, Video, MessageSquare, TrendingUp, Globe } from 'lucide-react';

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
  bgGradient: string;
  iconColor: string;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: 1,
    title: "Welcome to Social AI Agent",
    subtitle: "Your AI-Powered Social Media Revolution",
    description: "Transform your social media presence with cutting-edge AI technology that creates, schedules, and optimizes content across all major platforms.",
    icon: Sparkles,
    features: [
      "15+ AI models including GPT-4, Gemini Pro, Claude",
      "Multi-platform posting & scheduling",
      "Advanced analytics & insights",
      "Automated content optimization"
    ],
    bgGradient: "from-blue-600 via-purple-600 to-indigo-700",
    iconColor: "text-yellow-300"
  },
  {
    id: 2,
    title: "AI-Powered Content Creation",
    subtitle: "Professional Content in Seconds",
    description: "Generate engaging posts, captions, and hashtags tailored to your brand voice using advanced AI models from OpenAI, Google, Anthropic, and more.",
    icon: Brain,
    features: [
      "Smart content generation with brand voice",
      "AI image & video generation",
      "Intelligent hashtag research",
      "Platform-specific optimization"
    ],
    bgGradient: "from-emerald-500 via-teal-600 to-cyan-700",
    iconColor: "text-purple-300"
  },
  {
    id: 3,
    title: "Multi-Platform Management",
    subtitle: "One Dashboard, All Platforms",
    description: "Seamlessly manage Facebook, Instagram, Twitter, LinkedIn, TikTok, and YouTube from a single, intuitive dashboard.",
    icon: Globe,
    features: [
      "6 major social platforms",
      "Unified posting & scheduling",
      "Platform-specific features",
      "Real-time connection status"
    ],
    bgGradient: "from-orange-500 via-red-500 to-pink-600",
    iconColor: "text-blue-300"
  },
  {
    id: 4,
    title: "Smart Scheduling & Automation",
    subtitle: "Perfect Timing, Maximum Engagement",
    description: "AI analyzes your audience behavior to schedule posts at optimal times for maximum reach and engagement across all platforms.",
    icon: Calendar,
    features: [
      "AI-powered optimal timing",
      "Automated posting queues",
      "Campaign management",
      "Drag-and-drop calendar interface"
    ],
    bgGradient: "from-violet-600 via-purple-600 to-fuchsia-700",
    iconColor: "text-green-300"
  },
  {
    id: 5,
    title: "Advanced Media & Analytics",
    subtitle: "Professional Content Library & Insights",
    description: "Comprehensive media management with AI video generation, advanced analytics, and performance tracking to optimize your social strategy.",
    icon: BarChart3,
    features: [
      "AI video & image generation",
      "Advanced media gallery",
      "Performance analytics",
      "Content optimization insights"
    ],
    bgGradient: "from-amber-500 via-orange-600 to-red-600",
    iconColor: "text-indigo-300"
  },
  {
    id: 6,
    title: "Enterprise Features",
    subtitle: "Scale Your Social Presence",
    description: "Advanced campaign management, team collaboration, AI training, and enterprise-grade features for businesses of all sizes.",
    icon: Target,
    features: [
      "Campaign management system",
      "AI training & learning",
      "Team collaboration tools",
      "White-label customization"
    ],
    bgGradient: "from-indigo-600 via-blue-600 to-purple-700",
    iconColor: "text-yellow-300"
  }
];

interface OnboardingCarouselProps {
  onGetStarted: () => void;
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ onGetStarted }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % onboardingSlides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % onboardingSlides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + onboardingSlides.length) % onboardingSlides.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const currentSlideData = onboardingSlides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.bgGradient} transition-all duration-1000`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-white/20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-white/15 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-white/10 rounded-full animate-pulse"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col justify-center items-center min-h-screen px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Icon */}
          <div className="mb-8 animate-in slide-in-from-top duration-700">
            <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/30">
              <Icon className={`w-12 h-12 ${currentSlideData.iconColor}`} />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              {currentSlideData.title}
            </h1>
            <h2 className="text-2xl md:text-3xl font-medium text-white/90">
              {currentSlideData.subtitle}
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              {currentSlideData.description}
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
              {currentSlideData.features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-colors duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-white font-medium">{feature}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center space-x-4 mt-12">
            <button
              onClick={prevSlide}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 hover:bg-white/30 transition-colors duration-300"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            {/* Dots */}
            <div className="flex space-x-2">
              {onboardingSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'bg-white scale-125'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 hover:bg-white/30 transition-colors duration-300"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Get Started Button */}
          <div className="mt-12">
            <button
              onClick={onGetStarted}
              className="bg-white text-gray-900 px-12 py-4 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-colors duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105"
            >
              Get Started Free
            </button>
            <p className="text-white/70 mt-4">
              Join thousands of creators and businesses already using Social AI Agent
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / onboardingSlides.length) * 100}%` }}
        />
      </div>
    </div>
  );
};
