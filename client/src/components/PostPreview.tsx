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
} from "lucide-react";
import { GeneratedPost, Platform } from "../types";
import { getPlatformIcon, getPlatformColors, getPlatformDisplayName } from "../utils/platformIcons";

interface PostPreviewProps {
  posts: any[];
  onBack: () => void;
  onEdit: () => void;
  onPublish?: () => void;
  onPostsUpdate?: (updatedPosts: GeneratedPost[]) => void;
  onRegeneratePlatform?: (platform: Platform) => void;
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

  // Calculate initial character counts for all posts
  useEffect(() => {
    const postsWithCharacterCount = generatedPosts.map(post => ({
      ...post,
      characterCount: post.characterCount || 
        (post.caption?.length || 0) + (post.hashtags?.join(' ')?.length || 0)
    }));
    setPosts(postsWithCharacterCount);
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




  // Utility function to detect if URL is a video
  const isVideoUrl = useCallback((url: string) => {
    if (!url) return false;
    
    // Check if it's a video file - match actual video file extensions
    // Exclude data URLs and certain image generation services
    return !url.startsWith('data:') && 
           !url.includes('pollinations.ai') && 
           /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|3gp)(\?.*)?$/i.test(url);
  }, []);

  // Render media for platforms that need general media placement (Facebook, Twitter, LinkedIn)
  const renderMedia = useCallback((post: GeneratedPost, className = "rounded-lg max-h-80 object-contain", containerClass = "w-full flex justify-center my-3") => {
//    alert('Rendering media'+ post.imageUrl);
    if (!post.mediaUrl) return null;
    
    if (isVideoUrl(post.mediaUrl)) {
      return (
        <div className={containerClass}>
          <video
            src={post.mediaUrl}
            controls
            className={className}
            onError={(e) => {
              console.error('Media (video) failed to load:', post.mediaUrl);
              //e.currentTarget.style.display = 'none';
            }}
            onLoadStart={() => console.log('Media (video) loading started:', post.mediaUrl)}
          >
            Your browser does not support the video tag.
          </video>
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
  }, [isVideoUrl]);

  const renderPlatformPreview = (post: GeneratedPost) => {
    console.log('DEBUG: Pre-fallback - imageUrl:', post.imageUrl, 'mediaUrl:', post.mediaUrl);
    post.mediaUrl = post.imageUrl?? post.mediaUrl; // Fallback to imageUrl if mediaUrl not set
    console.log('DEBUG: Post-fallback - mediaUrl:', post.mediaUrl);
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
                  <h3 className="font-medium text-gray-900">Your Campaign</h3>
                  <p className="text-xs text-gray-500">Just now · 🌍</p>
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
              {renderMedia(post)}
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
                  <h3 className="font-medium text-gray-900 text-sm">
                    yourcampaign
                  </h3>
                </div>
              </div>
            </div>
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {post.mediaUrl ? (
                isVideoUrl(post.mediaUrl) ? (
                  <video
                  
                    src={post.mediaUrl}
                    controls
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      console.error('Instagram media (video) failed to load:', post.mediaUrl);
                      e.currentTarget.style.display = 'none';
                    }} 
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt="Instagram media"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      console.error('Instagram media (image) failed to load:', post.mediaUrl);
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
                    <h3 className="font-bold text-gray-900">Your Campaign</h3>
                    <span className="text-gray-500">@yourcampaign</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-500">now</span>
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
                  {renderMedia(post)}
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
                  <h3 className="font-medium text-gray-900">Your Campaign</h3>
                  <p className="text-sm text-gray-500">Campaign • 1st</p>
                  <p className="text-xs text-gray-400">Just now</p>
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
              {renderMedia(post)}
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
              {post.mediaUrl && (
                isVideoUrl(post.mediaUrl) ? (
                  <video
                    src={post.mediaUrl}
                    controls
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      console.error('TikTok media (video) failed to load:', post.mediaUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt="TikTok media"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      console.error('TikTok media (image) failed to load:', post.mediaUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )
              )}
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
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              {post.mediaUrl ? (
                isVideoUrl(post.mediaUrl) ? (
                  <video
                    src={post.mediaUrl}
                    controls
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      console.error('YouTube media (video) failed to load:', post.mediaUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt="YouTube media"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      console.error('YouTube media (image) failed to load:', post.mediaUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )
              ) : (
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">▶</span>
                </div>
              )}
            </div>
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
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Your AI-Generated Posts
        </h2>
        <p className="text-gray-600">
          Review, copy, and share your optimized content
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Platform Selector */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
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
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-lg ${
                    post.engagement === "high"
                      ? "bg-green-500"
                      : post.engagement === "medium"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}></div>
                  
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Preview</h3>

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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Post Directly
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
                    <div className="flex justify-between md:flex-col md:items-start">
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
                    </div>
                  </div>
                  {selectedPost.hashtags.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Hashtags
                      </h5>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {selectedPost.hashtags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-8 border-t border-gray-200 mt-8">
        <button
          onClick={onEdit}
          className="flex-1 bg-gray-100 text-gray-700 py-4 px-8 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <Edit className="w-5 h-5" />
          <span>Edit Content</span>
        </button>
        <button
          onClick={onBack}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Regenerate
        </button>
      </div>

      <div className="mt-4">
        <button
          onClick={onPublish}
          className="w-full bg-green-600 text-white py-4 px-8 rounded-lg font-medium hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          Publish to Platforms
        </button>
      </div>
    </div>
  );
};
