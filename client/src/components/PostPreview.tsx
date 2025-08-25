import React, { useState, useCallback, useMemo } from "react";
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
  onPostsUpdate?: (updatedPosts: GeneratedPost[]) => void; // Made optional
  editingPost?: GeneratedPost | null; // Made optional
  setEditingIndex?: React.Dispatch<React.SetStateAction<number | null>>; // Made optional
  editingIndex?: number | null; // Made optional
}

export const PostPreview: React.FC<PostPreviewProps> = ({
  posts: generatedPosts, // Renamed to avoid conflict with selectedPlatform initialization
  onBack,
  onEdit,
  onPublish,
  onPostsUpdate, // Receive the new prop
  editingPost, // Receive the new prop
  setEditingIndex, // Receive the new prop
  editingIndex, // Receive the new prop
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(
    generatedPosts[0]?.platform || "facebook",
  );
  const [copiedPost, setCopiedPost] = useState<string | null>(null);
  const [editingPostIndex, setEditingPostIndex] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState<string>("");
  const [editingHashtags, setEditingHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState<string>("");

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPost(selectedPlatform);
      setTimeout(() => setCopiedPost(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Editing functions
  const startEditing = useCallback((postIndex: number) => {
    const post = generatedPosts[postIndex];
    if (post) {
      setEditingPostIndex(postIndex);
      setEditingCaption(post.caption);
      setEditingHashtags([...post.hashtags]);
    }
  }, [generatedPosts]);

  const cancelEditing = useCallback(() => {
    setEditingPostIndex(null);
    setEditingCaption("");
    setEditingHashtags([]);
    setNewHashtag("");
  }, []);

  const saveEditing = useCallback(() => {
    if (editingPostIndex !== null && onPostsUpdate) {
      const updatedPosts = [...generatedPosts];
      updatedPosts[editingPostIndex] = {
        ...updatedPosts[editingPostIndex],
        caption: editingCaption,
        hashtags: editingHashtags,
        characterCount: editingCaption.length,
      };
      onPostsUpdate(updatedPosts);
      cancelEditing();
    }
  }, [editingPostIndex, editingCaption, editingHashtags, generatedPosts, onPostsUpdate, cancelEditing]);

  const addHashtag = useCallback(() => {
    if (newHashtag.trim() && !editingHashtags.includes(newHashtag.trim())) {
      const formattedTag = newHashtag.startsWith('#') ? newHashtag : `#${newHashtag}`;
      setEditingHashtags([...editingHashtags, formattedTag]);
      setNewHashtag("");
    }
  }, [newHashtag, editingHashtags]);

  const removeHashtag = useCallback((indexToRemove: number) => {
    setEditingHashtags(editingHashtags.filter((_, index) => index !== indexToRemove));
  }, [editingHashtags]);



  const renderPlatformPreview = (post: GeneratedPost) => {
    const renderMedia = useCallback(() => {
      if (!post.imageUrl) return null;
      
      // Check if it's a video file - only match actual video file extensions at end of URL
      // Exclude data URLs and URLs with query parameters that might contain video extensions
      const isVideo = !post.imageUrl.startsWith('data:') && 
                     !post.imageUrl.includes('pollinations.ai') && 
                     /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(post.imageUrl);
      
      if (isVideo) {
        return (
          <div className="w-full flex justify-center my-3">
            <video
              src={post.imageUrl}
              controls
              className="rounded-lg max-h-80 object-contain"
              onError={(e) => {
                console.error('Video failed to load:', post.imageUrl);
                e.currentTarget.style.display = 'none';
              }}
              onLoadStart={() => console.log('Video loading started:', post.imageUrl)}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      } else {
        return (
          <div className="w-full flex justify-center my-3">
            <img
              src={post.imageUrl}
              alt="Post media"
              className="rounded-lg max-h-80 object-contain"
              onError={(e) => {
                console.error('Image failed to load:', post.imageUrl);
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => console.log('Image loaded successfully:', post.imageUrl)}
            />
          </div>
        );
      }
    }, [post.imageUrl]);
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
              <p className="text-gray-800 whitespace-pre-wrap">
                {post.caption}
              </p>
              {renderMedia()}
              <div className="mt-3 flex flex-wrap gap-1">
                {post.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-blue-600 text-sm hover:underline cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
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
              {post.imageUrl ? (
                !post.imageUrl.startsWith('data:') && 
                !post.imageUrl.includes('pollinations.ai') && 
                /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(post.imageUrl) ? (
                  <video
                    src={post.imageUrl}
                    controls
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      console.error('Instagram video failed to load:', post.imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={post.imageUrl}
                    alt="Instagram media"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      console.error('Instagram image failed to load:', post.imageUrl);
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
              <p className="text-sm">
                <span className="font-medium">yourcampaign</span> {post.caption}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {post.hashtags.map((tag, index) => (
                  <span key={index} className="text-blue-600 text-sm">
                    {tag}
                  </span>
                ))}
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
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {post.caption}
                  </p>
                  {renderMedia()}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {post.hashtags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-blue-500 text-sm hover:underline cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
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
              <p className="text-gray-800 whitespace-pre-wrap mb-3">
                {post.caption}
              </p>
              {renderMedia()}
              <div className="flex flex-wrap gap-1 mb-4">
                {post.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-blue-600 text-sm hover:underline cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
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
              {post.imageUrl && (
                !post.imageUrl.startsWith('data:') && 
                !post.imageUrl.includes('pollinations.ai') && 
                /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(post.imageUrl) ? (
                  <video
                    src={post.imageUrl}
                    controls
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      console.error('TikTok video failed to load:', post.imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={post.imageUrl}
                    alt="Tiktok media"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      console.error('TikTok image failed to load:', post.imageUrl);
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
              {post.imageUrl ? (
                !post.imageUrl.startsWith('data:') && 
                !post.imageUrl.includes('pollinations.ai') && 
                /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(post.imageUrl) ? (
                  <video
                    src={post.imageUrl}
                    controls
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      console.error('YouTube video failed to load:', post.imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={post.imageUrl}
                    alt="Youtube media"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      console.error('YouTube image failed to load:', post.imageUrl);
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
              <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {post.caption.split("\n")[0]}
              </h3>
              <p className="text-sm text-gray-600 mb-3">{post.caption}</p>
              <div className="flex flex-wrap gap-1">
                {post.hashtags.map((tag, index) => (
                  <span key={index} className="text-blue-600 text-sm">
                    {tag}
                  </span>
                ))}
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
  const selectedPost = generatedPosts.find(
    (post) => post.platform === selectedPlatform,
  );

  // Handle save logic
  const handleSave = (postIndex: number, updatedPost: any) => {
    console.log("Saving post:", postIndex, updatedPost);
    const updatedPosts = [...generatedPosts]; // Use generatedPosts here
    updatedPosts[postIndex] = {
      ...updatedPosts[postIndex],
      caption: updatedPost.caption || updatedPost.content || "", // Ensure caption is always set
      hashtags: updatedPost.hashtags || [],
      imageUrl: updatedPost.imageUrl || updatedPosts[postIndex].imageUrl, // Preserve existing imageUrl if not in updatedPost
    };
    console.log("Updated posts:", updatedPosts);
    onPostsUpdate?.(updatedPosts);
    setEditingIndex?.(null);
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Platform Selector */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Select Platform
          </h3>
          <div className="flex flex-wrap gap-3">
            {generatedPosts.map((post, index) => {
              const IconComponent = getPlatformIcon(post.platform);
              return (
                <button
                  key={post.platform}
                  onClick={() => setSelectedPlatform(post.platform)}
                  className={`relative p-3 rounded-full transition-all duration-200 transform hover:scale-105 ${
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
          
          
          
          {selectedPost && (
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
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>

          {/* Platform Preview */}
          <div className="flex justify-center mb-6">
            {selectedPost && renderPlatformPreview(selectedPost)}
          </div>

          {/* Inline Editing Controls */}
          {selectedPost && (
            <div className="flex justify-center mb-6">
              <div className="max-w-lg w-full">
                {editingPostIndex === generatedPosts.findIndex(p => p.platform === selectedPlatform) ? (
                  // Editing Mode
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900">Quick Edit</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEditing}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                    
                    {/* Caption Editor */}
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Caption</label>
                      <textarea
                        value={editingCaption}
                        onChange={useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          setEditingCaption(e.target.value);
                        }, [])}
                        className="w-full p-3 border border-blue-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Enter your post caption..."
                      />
                      <p className="text-xs text-blue-600 mt-1">{editingCaption.length} characters</p>
                    </div>

                    {/* Hashtags Editor */}
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Hashtags</label>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {editingHashtags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {tag}
                            <button
                              onClick={() => removeHashtag(index)}
                              className="hover:text-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newHashtag}
                          onChange={(e) => setNewHashtag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                          className="flex-1 p-2 border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Add hashtag (without #)"
                        />
                        <button
                          onClick={addHashtag}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View Mode with Edit Button
                  <div className="text-center">
                    <button
                      onClick={() => startEditing(generatedPosts.findIndex(p => p.platform === selectedPlatform))}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Quick Edit Post
                    </button>
                  </div>
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
