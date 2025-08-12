import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Zap } from 'lucide-react';
import { CompanyInfo, PostContent, GeneratedPost, Platform } from '../types';
import { generateAllPosts } from '../lib/gemini';

interface AIGeneratorProps {
  contentData: any;
  onComplete: (posts: any[]) => void;
  onBack?: () => void;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({
  contentData,
  onComplete,
  onBack,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState<Platform | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (contentData) {
      generatePosts();
    }
  }, [contentData]); // Restore original dependency

  const generatePosts = async () => {
    if (isGenerating) return; // Prevent duplicate calls
    
    setIsGenerating(true);
    setProgress(0);
    setCurrentPlatform(null);

    try {
      // Use selected platforms from content data or default to LinkedIn
      const targetPlatforms = contentData?.selectedPlatforms || contentData?.platforms || ['linkedin'];

      // Create a minimal company info for generation
      const companyInfo: CompanyInfo = {
        name: contentData?.companyName || 'Default Company',
        website: contentData?.website || 'https://example.com',
        industry: contentData?.industry || 'Technology',
        description: contentData?.description || 'A technology company',
        targetAudience: contentData?.targetAudience || 'Professionals',
        brandTone: (contentData?.tone as any) || 'professional',
        goals: contentData?.goals || ['brand_building'],
        platforms: targetPlatforms
      };

      const posts = await generateAllPosts(
        companyInfo,
        contentData,
        (platform, progress) => {
          setCurrentPlatform(platform);
          setProgress(progress);
        }
      );

      // Generate images for posts that need them
      if (posts && posts.length > 0) {
        for (let i = 0; i < posts.length; i++) {
          const post = posts[i];
          if (post.caption && !post.imageUrl) {
            try {
              // Generate an image based on the post content
              const imagePrompt = `Professional ${post.platform} image for: ${post.caption.substring(0, 100)}`;
              const imageResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/generate-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: imagePrompt,
                  style: 'professional',
                  size: post.platform === 'instagram' ? '1024x1024' : '1792x1024'
                })
              });

              if (imageResponse.ok) {
                const imageData = await imageResponse.json();
                posts[i].imageUrl = imageData.imageUrl;
              }
            } catch (imageError) {
              console.warn('Failed to generate image for post:', imageError);
            }
          }
        }
      }

      setIsGenerating(false);
      setCurrentPlatform(null);

      if (posts && posts.length > 0) {
        onComplete(posts);
      } else {
        console.error('No posts generated');
        // Create fallback posts if generation fails
        const fallbackPosts = targetPlatforms.map((platform: Platform) => ({
          platform,
          caption: contentData?.prompt || 'Check out our latest updates!',
          hashtags: ['#business', '#updates'],
          imageUrl: null
        }));
        onComplete(fallbackPosts);
      }
    } catch (error: any) {
      console.error('Error generating posts:', error);
      setIsGenerating(false);
      setCurrentPlatform(null);

      // Check if it's a quota error
      if (error.message && error.message.includes('quota')) {
        console.warn('API quota exceeded, creating fallback posts');
        const targetPlatforms = contentData?.selectedPlatforms || contentData?.platforms || ['linkedin'];
        const fallbackPosts = targetPlatforms.map((platform: Platform) => ({
          platform,
          caption: contentData?.prompt || 'Check out our latest updates!',
          hashtags: ['#business', '#updates'],
          imageUrl: null
        }));
        onComplete(fallbackPosts);
      } else {
        onComplete([]);
      }
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      linkedin: '💼',
      tiktok: '🎵',
      youtube: '🎬'
    };
    return icons[platform] || '📱';
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Brain className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">AI is Crafting Your Posts</h2>
        <p className="text-gray-600">Creating optimized content for each platform</p>
      </div>

      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current Platform */}
        {currentPlatform && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-3xl animate-bounce">
                {getPlatformIcon(currentPlatform)}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-800">
                  Optimizing for {currentPlatform.charAt(0).toUpperCase() + currentPlatform.slice(1)}
                </p>
                <p className="text-sm text-gray-600">
                  Analyzing audience, tone, and platform best practices...
                </p>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* AI Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <Sparkles className="w-6 h-6 text-yellow-500 mb-2" />
            <h3 className="font-medium text-gray-900">Smart Optimization</h3>
            <p className="text-sm text-gray-600">Tailoring content for each platform's unique audience</p>
          </div>
          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <Zap className="w-6 h-6 text-blue-500 mb-2" />
            <h3 className="font-medium text-gray-900">Hashtag Research</h3>
            <p className="text-sm text-gray-600">Finding trending and relevant hashtags</p>
          </div>
          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <Brain className="w-6 h-6 text-purple-500 mb-2" />
            <h3 className="font-medium text-gray-900">Tone Analysis</h3>
            <p className="text-sm text-gray-600">Matching your brand voice perfectly</p>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Processing {contentData?.selectedPlatforms?.length || contentData?.platforms?.length || 1} platform{(contentData?.selectedPlatforms?.length || contentData?.platforms?.length || 1) > 1 ? 's' : ''}...</p>
        </div>
      </div>
    </div>
  );
};