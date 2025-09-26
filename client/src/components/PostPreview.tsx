import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Copy,
  Download,
  Share2,
  Heart,
  MessageCircle,
  Repeat2,
  Eye,
  ThumbsUp,
  Send,
  Edit,
  Save,
  X,
  Wand2,
  Loader,
} from "lucide-react";
import Icon from './Icon';
import { GeneratedPost, Platform } from "../types";
import { getPlatformIcon, getPlatformColors, getPlatformDisplayName } from "../utils/platformIcons";

interface PostPreviewProps {
  posts: any[];
  onBack: () => void;
  onEdit: () => void;
  onPublish?: () => void;
  onPostsUpdate?: (updatedPosts: GeneratedPost[]) => void;
  onRegeneratePlatform?: (platform: Platform, customPrompt?: string) => void;
  onConnectAccounts?: () => void;
}

export const PostPreview: React.FC<PostPreviewProps> = ({
  posts: generatedPosts,
  onBack,
  onEdit,
  onPublish,
  onPostsUpdate,
  onRegeneratePlatform,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(
    generatedPosts[0]?.platform || "facebook",
  );
  const [copiedPost, setCopiedPost] = useState<string | null>(null);
  const [editingMode, setEditingMode] = useState<boolean>(false);
  const [posts, setPosts] = useState<GeneratedPost[]>(generatedPosts);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isRegeneratingMode, setIsRegeneratingMode] = useState<boolean>(false);
  const [regenerationPrompt, setRegenerationPrompt] = useState<string>('');  
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Calculate initial character counts for all posts
  useEffect(() => {
    const postsWithCharacterCount = generatedPosts.map(post => ({
      ...post,
      characterCount: post.characterCount || 
        (post.caption?.length || 0) + (post.hashtags?.join(' ')?.length || 0)
    }));
    setPosts(postsWithCharacterCount);
    
    // Debug: Check if posts have generationPrompt
    console.log('🔍 PostPreview received posts:', generatedPosts.map(post => ({
      platform: post.platform,
      hasGenerationPrompt: !!post.generationPrompt,
      generationPrompt: post.generationPrompt?.substring(0, 50) + '...' || 'NONE'
    })));
  }, [generatedPosts]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPost(selectedPlatform);
      setTimeout(() => setCopiedPost(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Handle caption edit
  const handleCaptionEdit = useCallback((newCaption: string) => {
    const currentPostIndex = posts.findIndex(p => p.platform === selectedPlatform);
    if (currentPostIndex !== -1) {
      const updatedPosts = [...posts];
      updatedPosts[currentPostIndex] = {
        ...updatedPosts[currentPostIndex],
        caption: newCaption,
        characterCount: newCaption.length + updatedPosts[currentPostIndex].hashtags.join(' ').length
      };
      setPosts(updatedPosts);
      setHasUnsavedChanges(true);
    }
  }, [posts, selectedPlatform]);

  // Handle hashtags edit (single field with all hashtags)
  const handleHashtagsEdit = useCallback((hashtagText: string) => {
    const currentPostIndex = posts.findIndex(p => p.platform === selectedPlatform);
    if (currentPostIndex !== -1) {
      // Parse hashtags from text - split by spaces and ensure they start with #
      const hashtags = hashtagText
        .split(/\s+/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
      
      const updatedPosts = [...posts];
      updatedPosts[currentPostIndex] = {
        ...updatedPosts[currentPostIndex],
        hashtags: hashtags,
        characterCount: updatedPosts[currentPostIndex].caption.length + hashtags.join(' ').length
      };
      setPosts(updatedPosts);
      setHasUnsavedChanges(true);
    }
  }, [posts, selectedPlatform]);

  const saveChanges = useCallback(() => {
    if (onPostsUpdate) {
      onPostsUpdate(posts);
      setHasUnsavedChanges(false);
    }
  }, [posts, onPostsUpdate]);

  const discardChanges = useCallback(() => {
    setPosts(generatedPosts);
    setHasUnsavedChanges(false);
    setEditingMode(false);
  }, [generatedPosts]);

  // Handle regeneration mode toggle
  const handleRegenerateClick = useCallback(() => {
    setIsRegeneratingMode(true);
    // Initialize with the platform-specific prompt stored in the post object
    const currentPost = posts.find((post) => post.platform === selectedPlatform);
    const platformPrompt = currentPost?.generationPrompt || '';
    setRegenerationPrompt(platformPrompt);
  }, [posts, selectedPlatform]);

  // Handle regeneration submission
  const handleRegenerateSubmit = useCallback(async () => {
    const currentPost = posts.find((post) => post.platform === selectedPlatform);
    console.log('🚀 HandleRegenerateSubmit called:', {
      selectedPlatform,
      currentPost: currentPost ? { platform: currentPost.platform, hasGenerationPrompt: !!currentPost.generationPrompt } : null,
      regenerationPrompt: regenerationPrompt.substring(0, 50) + '...',
      onRegeneratePlatform: !!onRegeneratePlatform
    });
    
    if (onRegeneratePlatform && currentPost) {
      // Set loading state
      setIsRegenerating(true);
      
      try {
        // Update the post object with the new prompt before regenerating
        const currentPostIndex = posts.findIndex(p => p.platform === selectedPlatform);
        if (currentPostIndex !== -1) {
          const updatedPosts = [...posts];
          updatedPosts[currentPostIndex] = {
            ...updatedPosts[currentPostIndex],
            generationPrompt: regenerationPrompt
          };
          setPosts(updatedPosts);
          
          // Trigger save to parent if available
          if (onPostsUpdate) {
            onPostsUpdate(updatedPosts);
          }
        }
        
        console.log('🔥 Calling onRegeneratePlatform with:', { platform: currentPost.platform, prompt: regenerationPrompt.substring(0, 50) + '...' });
        await onRegeneratePlatform(currentPost.platform, regenerationPrompt);
        
        // Reset regeneration mode after successful submission
        setIsRegeneratingMode(false);
        setRegenerationPrompt('');
      } catch (error) {
        console.error('❌ Error during regeneration:', error);
        // Keep regeneration mode open on error so user can retry
      } finally {
        setIsRegenerating(false);
      }
    } else {
      console.error('❌ Cannot regenerate:', { 
        hasOnRegeneratePlatform: !!onRegeneratePlatform, 
        hasCurrentPost: !!currentPost 
      });
    }
  }, [onRegeneratePlatform, onPostsUpdate, posts, selectedPlatform, regenerationPrompt]);

  // Handle regeneration cancel
  const handleRegenerateCancel = useCallback(() => {
    setIsRegeneratingMode(false);
    setRegenerationPrompt('');
  }, []);

  // Update regeneration prompt when platform changes (for when regeneration mode is already active)
  useEffect(() => {
    if (isRegeneratingMode) {
      const currentPost = posts.find((post) => post.platform === selectedPlatform);
      const platformPrompt = currentPost?.generationPrompt || '';
      console.log(`🔄 Platform changed to ${selectedPlatform}, updating regeneration prompt:`, platformPrompt);
      setRegenerationPrompt(platformPrompt);
    }
  }, [selectedPlatform, posts, isRegeneratingMode]);




  // Utility function to detect if URL is a video
  const isVideoUrl = useCallback((url: string) => {
    if (!url) return false;
    
    // Check if it's a video file - match actual video file extensions
    // Exclude data URLs and certain image generation services
    return !url.startsWith('data:') && 
           !url.includes('pollinations.ai') && 
           /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|3gp)(\?.*)?$/i.test(url);
  }, []);

  // Helper to detect video even when URL has no extension (e.g., blob: URLs)
  const isVideoMedia = useCallback((p: any, url?: string) => {
    const mUrl = url ?? p?.mediaUrl;
    const typeFlag = !!(p?.isVideoContent || (p?.media?.type && p.media.type.startsWith('video/')) || p?.mediaType === 'video');
    return (mUrl ? isVideoUrl(mUrl) : false) || typeFlag;
  }, [isVideoUrl]);

  // Render media for platforms that need general media placement (Facebook, Twitter, LinkedIn)
  const renderMedia = useCallback((post: GeneratedPost, className = "rounded-lg max-h-80 object-contain", containerClass = "w-full flex justify-center my-3") => {
    console.log('renderMedia called with mediaUrl:', post.mediaUrl, 'isVideoContent:', (post as any).isVideoContent, 'videoAspectRatio:', (post as any).videoAspectRatio);
    if (!post.mediaUrl) return null;
    
    if (isVideoMedia(post, post.mediaUrl)) {
      // For videos, use custom thumbnail if available
      const videoThumbnail = (post as any).thumbnailUrl;
      const videoAspectRatio = (post as any).videoAspectRatio;
      
      // Determine aspect ratio class for video container
      let aspectRatioClass = "";
      let isPortraitVideo = false;
      if (videoAspectRatio) {
        const ratio = videoAspectRatio;
        if (ratio >= 1.6 && ratio <= 1.9) {
          // 16:9 or similar horizontal
          aspectRatioClass = "aspect-video";
        } else if (ratio >= 0.5 && ratio <= 0.65) {
          // 9:16 or similar vertical
          aspectRatioClass = "aspect-[9/16]";
          isPortraitVideo = true;
        }
      }
      
      return (
        <div className={`${containerClass} ${aspectRatioClass} relative`}>
          <video
            src={post.mediaUrl}
            poster={videoThumbnail || undefined} // Use custom thumbnail as poster or let video show first frame
            controls
            preload="metadata" // Load video metadata to show first frame
            className={`${className} ${aspectRatioClass ? 'object-cover w-full h-full' : ''}`}
            onError={(e) => {
              console.error('Media (video) failed to load:', post.mediaUrl);
              // Don't hide the video element, let the fallback overlay show
            }}
            onLoadStart={() => console.log('Media (video) loading started:', post.mediaUrl)}
            onLoadedData={() => console.log('Media (video) data loaded:', post.mediaUrl)}
          >
            Your browser does not support the video tag.
          </video>
          {/* Enhanced fallback overlay for videos without thumbnails */}
          {/* {!videoThumbnail && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-60 pointer-events-none rounded-lg">
              <div className="text-white text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3 mx-auto backdrop-blur-sm">
                  <span className="text-3xl">▶</span>
                </div>
                <p className="text-base font-medium opacity-90">
                  {isPortraitVideo ? 'Vertical Video' : 'Video Content'}
                </p>
                <p className="text-xs opacity-70 mt-1">Click to play</p>
              </div>
            </div>
          )} */}
        </div>
      );
    } else {
      return (
        <div className={containerClass}>
          <img
            src={post.mediaUrl}
            alt="Post media"
            className={className}
            onError={(e) => {
              console.error('Media (image) failed to load:', post.mediaUrl);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => console.log('Media (image) loaded successfully:', post.mediaUrl)}
          />
        </div>
      );
    }
  }, [isVideoUrl, isVideoMedia]);

  const renderPlatformPreview = (post: GeneratedPost) => {
    console.log('DEBUG: Pre-fallback - imageUrl:', post.imageUrl, 'mediaUrl:', post.mediaUrl);
    // Ensure we have media URL - use mediaUrl first, then fallback to imageUrl
    const mediaUrl = post.mediaUrl || post.imageUrl;
    console.log('DEBUG: Final mediaUrl:', mediaUrl, 'isVideo:', isVideoUrl(mediaUrl || ''));
    switch (post.platform) {
      case "facebook":
        return (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-lg">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  FB
                </div>
                <div>
                  {/* <h3 className="font-medium text-gray-900">Your Campaign</h3>
                  <p className="text-xs text-gray-500">Just now · 🌍</p> */}
                </div>
              </div>
            </div>
            <div className="p-4">
              <p 
                className={`text-gray-800 whitespace-pre-wrap ${editingMode ? 'border border-blue-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent' : ''}`}
                contentEditable={editingMode}
                suppressContentEditableWarning={true}
                onBlur={(e) => editingMode && handleCaptionEdit(e.currentTarget.textContent || '')}
                style={{ outline: editingMode ? 'none' : undefined }}
              >
                {post.caption}
              </p>
              {renderMedia({...post, mediaUrl})}
              <div className="mt-3">
                <div 
                  className={`text-blue-600 text-sm ${editingMode ? 'border border-blue-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent' : ''}`}
                  contentEditable={editingMode}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => editingMode && handleHashtagsEdit(e.currentTarget.textContent || '')}
                  style={{ outline: editingMode ? 'none' : undefined }}
                >
                  {post.hashtags.join(' ')}
                </div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">Like</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Comment</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "instagram":
        return (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-w-sm shadow-sm">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  IG
                </div>
                <div>
                  {/* <h3 className="font-medium text-gray-900 text-sm">
                    yourcampaign
                  </h3> */}
                </div>
              </div>
            </div>
            <div className={`bg-gray-100 flex items-center justify-center relative ${
              mediaUrl && isVideoMedia(post, mediaUrl) ? (() => {
                const videoAspectRatio = (post as any).videoAspectRatio;
                if (videoAspectRatio) {
                  const ratio = videoAspectRatio;
                  if (ratio >= 1.6 && ratio <= 1.9) {
                    return 'aspect-video'; // 16:9 horizontal
                  } else if (ratio >= 0.5 && ratio <= 0.65) {
                    return 'aspect-[9/16]'; // 9:16 vertical
                  }
                }
                return 'aspect-[9/16]'; // default for videos
              })() : 'aspect-square'
            }`}>
              {mediaUrl ? (
                isVideoMedia(post, mediaUrl) ? (
                  <>
                    <video
                      src={mediaUrl}
                      poster={(post as any).thumbnailUrl} // Use custom thumbnail for Instagram videos
                      controls
                      preload="metadata" // Load video metadata to show first frame
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        console.error('Instagram media (video) failed to load:', mediaUrl);
                        e.currentTarget.style.display = 'none';
                      }} 
                    >
                      Your browser does not support the video tag.
                    </video>
                    {/* Fallback overlay for videos without thumbnails */}
                    {/* {!(post as any).thumbnailUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-30 pointer-events-none">
                        <div className="text-white text-center">
                          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 mx-auto">
                            <span className="text-3xl">▶</span>
                          </div>
                          <p className="text-sm opacity-75">Video Content</p>
                        </div>
                      </div>
                    )} */}
                  </>
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Instagram media"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      console.error('Instagram media (image) failed to load:', mediaUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )
              ) : (
                <div className="text-gray-400 text-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
                  <p className="text-sm">Your media here</p>
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <Heart className="w-6 h-6 text-gray-700" />
                  <MessageCircle className="w-6 h-6 text-gray-700" />
                  <Send className="w-6 h-6 text-gray-700" />
                </div>
              </div>
              <div className="text-sm">
                <span className="font-medium">yourcampaign</span> 
                <span 
                  className={`${editingMode ? 'border border-blue-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent' : ''}`}
                  contentEditable={editingMode}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => editingMode && handleCaptionEdit(e.currentTarget.textContent || '')}
                  style={{ outline: editingMode ? 'none' : undefined }}
                >
                  {post.caption}
                </span>
              </div>
              <div className="mt-2">
                <div 
                  className={`text-blue-600 text-sm ${editingMode ? 'border border-blue-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent' : ''}`}
                  contentEditable={editingMode}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => editingMode && handleHashtagsEdit(e.currentTarget.textContent || '')}
                  style={{ outline: editingMode ? 'none' : undefined }}
                >
                  {post.hashtags.join(' ')}
                </div>
              </div>
            </div>
          </div>
        );

      case "twitter":
        return (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-lg shadow-sm">
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">
                  X
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {/* <h3 className="font-bold text-gray-900">Your Campaign</h3>
                    <span className="text-gray-500">@yourcampaign</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-500">now</span> */}
                  </div>
                  <p 
                    className={`text-gray-800 whitespace-pre-wrap ${editingMode ? 'border border-blue-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent' : ''}`}
                    contentEditable={editingMode}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => editingMode && handleCaptionEdit(e.currentTarget.textContent || '')}
                    style={{ outline: editingMode ? 'none' : undefined }}
                  >
                    {post.caption}
                  </p>
                  <div className="mt-2">
                    <div 
                      className={`text-blue-500 text-sm ${editingMode ? 'border border-blue-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent' : ''}`}
                      contentEditable={editingMode}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => editingMode && handleHashtagsEdit(e.currentTarget.textContent || '')}
                      style={{ outline: editingMode ? 'none' : undefined }}
                    >
                      {post.hashtags.join(' ')}
                    </div>
                  </div>
                  {renderMedia({...post, mediaUrl})}
                  <div className="flex items-center justify-between mt-3 max-w-md">
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">Reply</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500">
                      <Repeat2 className="w-4 h-4" />
                      <span className="text-sm">Repost</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">Like</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "linkedin":
        return (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-lg">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                  LI
                </div>
                <div>
                  {/* <h3 className="font-medium text-gray-900">Your Campaign</h3>
                  <p className="text-sm text-gray-500">Campaign • 1st</p>
                  <p className="text-xs text-gray-400">Just now</p> */}
                </div>
              </div>
              <p 
                className={`text-gray-800 whitespace-pre-wrap mb-3 ${editingMode ? 'border border-blue-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent' : ''}`}
                contentEditable={editingMode}
                suppressContentEditableWarning={true}
                onBlur={(e) => editingMode && handleCaptionEdit(e.currentTarget.textContent || '')}
                style={{ outline: editingMode ? 'none' : undefined }}
              >
                {post.caption}
              </p>
              <div className="mb-3">
                <div 
                  className={`text-blue-600 text-sm ${editingMode ? 'border border-blue-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent' : ''}`}
                  contentEditable={editingMode}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => editingMode && handleHashtagsEdit(e.currentTarget.textContent || '')}
                  style={{ outline: editingMode ? 'none' : undefined }}
                >
                  {post.hashtags.join(' ')}
                </div>
              </div>
              {renderMedia({...post, mediaUrl})}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">Like</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Comment</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>
          </div>
        );

      case "tiktok":
        return (
          <div className="bg-black rounded-lg overflow-hidden max-w-sm shadow-sm">
            <div className="aspect-[9/16] bg-gray-900 relative">
               <div className={`bg-gray-100 flex items-center justify-center relative ${
              mediaUrl && isVideoMedia(post, mediaUrl) ? (() => {
                const videoAspectRatio = (post as any).videoAspectRatio;
                if (videoAspectRatio) {
                  const ratio = videoAspectRatio;
                  if (ratio >= 1.6 && ratio <= 1.9) {
                    return 'aspect-video'; // 16:9 horizontal
                  } else if (ratio >= 0.5 && ratio <= 0.65) {
                    return 'aspect-[9/16]'; // 9:16 vertical
                  }
                }
                return 'aspect-[9/16]'; // default for videos
              })() : 'aspect-square'
            }`}>
              {mediaUrl ? (
                isVideoMedia(post, mediaUrl) ? (
                  <>
                    <video
                      src={mediaUrl}
                      poster={(post as any).thumbnailUrl} // Use custom thumbnail for Instagram videos
                      controls
                      preload="metadata" // Load video metadata to show first frame
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        console.error('TikTok media (video) failed to load:', mediaUrl);
                        e.currentTarget.style.display = 'none';
                      }} 
                    >
                      Your browser does not support the video tag.
                    </video>
                    {/* Fallback overlay for videos without thumbnails */}
                    {/* {!(post as any).thumbnailUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-30 pointer-events-none">
                        <div className="text-white text-center">
                          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 mx-auto">
                            <span className="text-3xl">▶</span>
                          </div>
                          <p className="text-sm opacity-75">Video Content</p>
                        </div>
                      </div>
                    )} */}
                  </>
                ) : (
                  <img
                    src={mediaUrl}
                    alt="TikTok media"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      console.error('TikTok media (image) failed to load:', mediaUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )
              ) : (
                <div className="text-gray-400 text-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
                  <p className="text-sm">Your media here</p>
                </div>
              )}
            </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-white">
                  <p className="text-sm mb-2">{post.caption}</p>
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.map((tag, index) => (
                      <span key={index} className="text-blue-400 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "youtube":
        return (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-lg">
          {renderMedia({...post, mediaUrl}, "rounded-lg max-h-96 object-contain w-full", "w-full flex justify-center bg-black")}
            <div className="p-4">
              <h3 
                className={`font-medium text-gray-900 mb-2 line-clamp-2 block ${editingMode ? 'border border-blue-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent' : ''}`}
                contentEditable={editingMode}
                suppressContentEditableWarning={true}
                onBlur={(e) => editingMode && handleCaptionEdit(e.currentTarget.textContent || '')}
                style={{ outline: editingMode ? 'none' : undefined }}
              >
                {post.caption}
              </h3>
              <div className="mb-3">
                <div 
                  className={`text-blue-600 text-sm ${editingMode ? 'border border-blue-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent' : ''}`}
                  contentEditable={editingMode}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => editingMode && handleHashtagsEdit(e.currentTarget.textContent || '')}
                  style={{ outline: editingMode ? 'none' : undefined }}
                >
                  {post.hashtags.join(' ')}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-3 capitalize">
              {post.platform}
            </h3>
            <p className="text-gray-800 whitespace-pre-wrap mb-3">
              {post.caption}
            </p>
            <div className="flex flex-wrap gap-1">
              {post.hashtags.map((tag, index) => (
                <span key={index} className="text-blue-600 text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        );
    }
  };

  const getFullPostText = (post: GeneratedPost) => {
    return `${post.caption}\n\n${post.hashtags.join(" ")}`;
  };

  // Find the currently selected post based on the selectedPlatform
  const selectedPost = posts.find(
    (post) => post.platform === selectedPlatform,
  );


  return (
    <div className="preview w-full mx-auto  rounded-2xl shadow-lg p-0">
      <h2 className="text-3xl font-semibold theme-text-primary mb-1">
           Your AI-Generated Posts
         </h2>
         <p className="text-sm theme-text-primary">
            Review, copy, and share your optimized content
         </p>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-1">
        {/* Platform Selector */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-0 text-left lg:text-center">
            Select Platform
          </h3>
             <div className="flex flex-wrap gap-3 justify-center">
            {generatedPosts.map((post, index) => {
              const IconComponent = getPlatformIcon(post.platform);
              return (
                <button
                  key={post.platform}
                  onClick={() => setSelectedPlatform(post.platform)}
                  className={`relative p-1 rounded-full transition-all duration-200 transform hover:scale-105 h-fit  ${
                    selectedPlatform === post.platform
                      ? "ring-4 ring-blue-200 shadow-lg"
                      : "hover:shadow-md"
                  }`}
                >
                  {/* Main Platform Icon */}
                  {IconComponent && (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getPlatformColors(post.platform)} shadow-lg`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                  )}
                  
                  {/* Indicator Light */}
                  {/* <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-lg ${
                    post.engagement === "high"
                      ? "bg-green-500"
                      : post.engagement === "medium"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}></div> */}
                  
                  {/* Selected Indicator */}
                  {selectedPlatform === post.platform && (
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>
          
          
          
          {/* {selectedPost && (
            <div className="mt-6 space-y-3">
              <button
                onClick={() => copyToClipboard(getFullPostText(selectedPost))}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  copiedPost === selectedPlatform
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                <Copy className="w-4 h-4" />
                <span>
                  {copiedPost === selectedPlatform ? "Copied!" : "Copy Post"}
                </span>
              </button>

              <button
                onClick={() => {
                  const element = document.createElement("a");
                  const file = new Blob([getFullPostText(selectedPost)], {
                    type: "text/plain",
                  });
                  element.href = URL.createObjectURL(file);
                  element.download = `${selectedPost.platform}-post.txt`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          )} */}
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 px-1 text-left lg:text-center">Preview</h3>

          {/* Platform Preview */}
          <div className="flex justify-center mb-6">
            {selectedPost && renderPlatformPreview(selectedPost)}
          </div>

          {/* Inline Editing Controls */}
          {selectedPost && (
            <div className="flex justify-center mb-6">
              <div className="max-w-lg w-full text-center space-y-3">
                {editingMode ? (
                  // Editing Mode - Show save/cancel buttons
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        saveChanges();
                        setEditingMode(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        discardChanges();
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                ) : (
                  // View Mode - Show edit button
                  <button
                    onClick={() => setEditingMode(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 theme-bg-quaternary theme-text-secondary rounded-lg hover:theme-bg-tertiary transition-colors w-full justify-center"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Post Text
                  </button>
                )}
                
                {editingMode && (
                  <p className="text-sm text-blue-600">
                    💡 Click on the text above to edit it directly in the preview!
                  </p>
                )}
                
                {hasUnsavedChanges && (
                  <p className="text-sm text-orange-600">
                    ⚠️ You have unsaved changes
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Post Details - Below Preview with constrained width */}
          {selectedPost && (
            <div className="flex justify-center">
              <div className="max-w-lg w-full space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    {(() => {
                      const IconComponent = getPlatformIcon(
                        selectedPost.platform,
                      );
                      return IconComponent ? (
                        <>
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${getPlatformColors(selectedPost.platform)}`}
                          >
                            <IconComponent className="w-3 h-3" />
                          </div>
                          <span className="capitalize">
                            {selectedPost.platform} Details
                          </span>
                        </>
                      ) : (
                        <span className="capitalize">
                          {selectedPost.platform} Details
                        </span>
                      );
                    })()}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex justify-between md:flex-col md:items-start">
                      <span className="text-gray-600">Character Count:</span>
                      <span className="font-medium">
                        {selectedPost.characterCount}
                      </span>
                    </div>
                    <div className="flex justify-between md:flex-col md:items-start">
                      <span className="text-gray-600">Hashtags:</span>
                      <span className="font-medium">
                        {selectedPost.hashtags.length}
                      </span>
                    </div>
                    {/* <div className="flex justify-between md:flex-col md:items-start">
                      <span className="text-gray-600">Engagement:</span>
                      <span
                        className={`font-medium capitalize ${
                          selectedPost.engagement === "high"
                            ? "text-green-600"
                            : selectedPost.engagement === "medium"
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {selectedPost.engagement}
                      </span>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Action Buttons / Regeneration Mode */}
      <div className="pt-8 border-t border-gray-200 mt-8">
        {!isRegeneratingMode ? (
          // Normal mode - show publish and regenerate buttons
          <>
            {/* Publish Button */}
            <button
              onClick={onPublish}
              className="btn-success w-full py-4 px-8"
            >
              PUBLISH TO PLATFORMS
            </button>
            
            {/* Or divider */}
            <div className="text-center theme-text-secondary my-2">
              <span className="text-lg font-medium">or</span>
            </div>
            
            {/* Regenerate Post Text Button */}
            <button
              onClick={handleRegenerateClick}
              className="btn-primary w-full py-4 px-8"
            >
              <Edit className="w-5 h-5" />
              REGENERATE POST TEXT
            </button>
          </>
        ) : (
          // Regeneration mode - show textarea and generate button
          <div className="theme-bg-quaternary rounded-lg p-6 border border-purple-200">
            <h4 className="text-lg font-semibold theme-text-secondary mb-4 text-center">
              Generate Post Text
            </h4>
            
            {/* Text Area */}
            <div className="mb-4">
              <textarea
                value={regenerationPrompt}
                onChange={(e) => {
                  const value = e.target.value;
                  setRegenerationPrompt(value);
                  // Keep the selected post's generationPrompt in sync while typing
                  setPosts(prev => {
                    const idx = prev.findIndex(p => p.platform === selectedPlatform);
                    if (idx === -1) return prev;
                    const updated = [...prev];
                    updated[idx] = { ...updated[idx], generationPrompt: value } as any;
                    return updated;
                  });
                }}
                placeholder="Enter your prompt to regenerate the post text for the selected platform..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent theme-text-secondary"
              />
            </div>
            
            {/* Generate Button with Coin Counter - Match ContentInput styling */}
            <button
              onClick={handleRegenerateSubmit}
              disabled={isRegenerating}
              className={`rounded-full w-full flex items-center justify-between theme-bg-trinary theme-text-light py-2 px-4 font-medium transition-all duration-200 text-sm ${
                isRegenerating ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              <div className="flex items-center">
                {isRegenerating ? (
                  <Loader className="w-6 h-6 mr-1 animate-spin" />
                ) : (
                  <Wand2 className="w-6 h-6 mr-1" />
                )}
                {isRegenerating ? 'REGENERATING...' : 'GENERATE POST TEXT'}
              </div>
              <div className="rounded-full theme-bg-quaternary theme-text-secondary px-2 py-1">
                <Icon name="wallet" size={14} className="inline mr-1 mt-[-1px]" />
                100
              </div>
            </button>
            
            {/* Cancel Button */}
            <div className="flex justify-center mt-4">
              <button
                onClick={handleRegenerateCancel}
                className="text-gray-500 hover:text-gray-700 px-4 py-2 text-sm font-medium"
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
