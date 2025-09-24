import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Camera,
  Wand2,
  Eye,
  Loader,
  Sparkles,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Target,
  Hash,
  MousePointer,
  Palette,
  Brain,
  Zap,
  Edit3,
  Trash2,
} from "lucide-react";
import Icon from './Icon';
import { PostContent, Platform } from "../types";
import { uploadMedia, getCurrentUser } from "../lib/database";
import { analyzeImage as analyzeImageWithGemini } from "../lib/gemini"; // Renamed to avoid conflict
import { PostPreview } from "./PostPreview";
import { getPlatformColors, platformOptions } from "../utils/platformIcons";
import { getCampaignById } from "../lib/database";
import { useAppContext } from "../context/AppContext";
import { TemplateSelector } from "./TemplateSelector";
import { ImageTemplateEditor } from "./ImageTemplateEditor";
import { Template } from "../types/templates";
import { getTemplateById } from "../utils/templates";
import { 
  isVideoFile, 
  generateVideoThumbnail, 
  createVideoThumbnailUrl, 
  getVideoAspectRatio, 
  is16x9Video,
  is9x16Video 
} from "../utils/videoUtils";
import { useLoadingAPI } from "../hooks/useLoadingAPI";
import { s } from "node_modules/vite/dist/node/types.d-aGj9QkWt";
import { LoadingTest } from "./LoadingTest";

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result.split(",")[1]); // Get base64 part
      } else {
        reject(new Error("FileReader result is not a string"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

interface ContentInputProps {
  onNext: (data: PostContent) => void;
  onBack: () => void;
  initialData?: Partial<PostContent>;
  selectedPlatforms?: Platform[];
  editMode?: boolean;
}

export const ContentInput: React.FC<ContentInputProps> = ({
  onNext,
  onBack,
  initialData,
  selectedPlatforms,
  editMode,
}) => {
  const { state } = useAppContext();
  const { 
    executeVideoThumbnailGeneration, 
    executeImageGeneration,
    executeWithLoading,
    executeFileUpload,
    showLoading,
    hideLoading 
  } = useLoadingAPI();
  const [formData, setFormData] = useState<PostContent>({
    prompt: initialData?.prompt || "",
    tags: initialData?.tags || [],
    selectedPlatforms: initialData?.selectedPlatforms ||
      selectedPlatforms || ["linkedin"],
    media: initialData?.media || undefined,
    mediaUrl: initialData?.mediaUrl || undefined,
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState("");
  const [useForAIReference, setUseForAIReference] = useState(true);
  const [useInPost, setUseInPost] = useState(true);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [campaignInfo, setCampaignInfo] = useState<any>(null);
  const [loadingCampaign, setLoadingCampaign] = useState(false);

  const [show, setShow] = useState(false);
  // Template-related state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | undefined>();
  const [templatedImageUrl, setTemplatedImageUrl] = useState<string>("");
  const [showImageMenu, setShowImageMenu] = useState(false);
  // Video post menu and mode state
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [selectedVideoMode, setSelectedVideoMode] = useState<'upload' | 'uploadShorts' | ''>('');

  // Post type selection state
  const [selectedPostType, setSelectedPostType] = useState<'text' | 'image' | 'video'>('text');

  // Image post sub-type selection state
  const [selectedImageMode, setSelectedImageMode] = useState<'upload' | 'textToImage' | ''>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to get appropriate platforms based on content type
  const getAppropiatePlatforms = (postType: 'text' | 'image' | 'video', imageMode?: string, videoMode?: string): Platform[] => {
    switch (postType) {
      case 'text':
        // Text post: all platforms except YouTube, TikTok, Instagram, and Twitter (disabled temporarily)
        return ['facebook', 'linkedin'];
      case 'image':
        // Image post: all platforms except TikTok, YouTube, and Twitter (disabled temporarily)
        return ['facebook', 'instagram', 'linkedin'];
      case 'video':
        if (videoMode === 'uploadShorts') {
          // 9:16 video (shorts): all platforms except Twitter (disabled temporarily)
          return ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'];
        } else if (videoMode === 'upload') {
          // 16:9 video: all platforms except Instagram, TikTok, and Twitter (disabled temporarily)
          return ['facebook', 'linkedin', 'youtube'];
        }
        // Default video: all platforms except Twitter (disabled temporarily)
        return ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'];
      default:
        return ['linkedin']; // Default fallback
    }
  };

  // Auto-select platforms based on content type and modes
  useEffect(() => {
    const appropriatePlatforms = getAppropiatePlatforms(selectedPostType, selectedImageMode, selectedVideoMode);
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: appropriatePlatforms
    }));
  }, [selectedPostType, selectedImageMode, selectedVideoMode]);

  // Initialize with existing data when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        prompt: initialData.prompt || "",
        tags: initialData.tags || [],
        selectedPlatforms: initialData.selectedPlatforms ||
          selectedPlatforms || ["linkedin"],
        media: initialData.media,
        mediaUrl: initialData.mediaUrl,
      }));
      if (initialData.imageAnalysis) {
        setImageAnalysis(initialData.imageAnalysis);
      }
    }
  }, [initialData, selectedPlatforms, editMode]);

  // useEffect(() => {
  //  setShowImageMenu(selectedPostType === 'image');


  // }, [selectedPostType, selectedImageMode]);

  // Fetch campaign information when a campaign is selected in context
  useEffect(() => {
    const fetchCampaignInfo = async () => {
      if (state.selectedCampaign && state.user?.id) {
        try {
          setLoadingCampaign(true);
          console.log('Fetching campaign info for:', state.selectedCampaign.id);

          const campaign = await getCampaignById(state.selectedCampaign.id, state.user.id);
          setCampaignInfo(campaign);
          console.log('Campaign info fetched:', campaign);

          // Update form data with campaign platforms if user hasn't selected any yet
          if (campaign.platforms && (!formData.selectedPlatforms || formData.selectedPlatforms.length === 0)) {
            setFormData(prev => ({
              ...prev,
              selectedPlatforms: campaign.platforms
            }));
          }
        } catch (error) {
          console.error('Error fetching campaign info:', error);
          setCampaignInfo(null);
        } finally {
          setLoadingCampaign(false);
        }
      } else {
        setCampaignInfo(null);
      }
    };

    fetchCampaignInfo();
  }, [state.selectedCampaign, state.user?.id]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    console.log('📁 File upload started:', file.name, file.type, file.size);
    console.log('Current formData state BEFORE:', { media: !!formData.media, mediaUrl: !!formData.mediaUrl });

    // Clear template-related state when uploading a new file
    setTemplatedImageUrl("");
    setSelectedTemplate(undefined);
    setImageAnalysis("");
    setVideoThumbnailUrl("");
    setOriginalVideoFile(null);
    setVideoAspectRatio(null);

    console.log('🔄 Setting file immediately for preview...');

    // Create immediate preview URL from the file
    const previewUrl = URL.createObjectURL(file);
    console.log('📷 Created preview URL:', previewUrl);

    setFormData((prev) => {
      console.log('Previous formData:', { media: !!prev.media, mediaUrl: !!prev.mediaUrl });
      // Clean up previous blob URL if it exists
      if (prev.mediaUrl && prev.mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(prev.mediaUrl);
        console.log('🗑️ Cleaned up previous blob URL during upload');
      }
      const newData = { ...prev, media: file, mediaUrl: previewUrl };
      console.log('New formData after setting file:', { media: !!newData.media, mediaUrl: !!newData.mediaUrl });
      return newData;
    });

    // Handle video files - analyze aspect ratio only (no thumbnail generation yet)
    if (isVideoFile(file)) {
      console.log('🎥 Video file detected, analyzing aspect ratio...');
      try {
        // Store the original video file
        setOriginalVideoFile(file);
        
        // Get video aspect ratio
        const aspectRatio = await getVideoAspectRatio(file);
        setVideoAspectRatio(aspectRatio);
        console.log('📐 Video aspect ratio:', aspectRatio);
        console.log('📝 Video thumbnail will be generated when Generate Post is clicked');
        
      } catch (error) {
        console.error('❌ Error processing video:', error);
        // Continue with video upload even if aspect ratio detection fails
      }
    }

    // Force a re-render to ensure file preview shows
    console.log('🔄 File should be visible now with preview');

    try {
      const userResult = await getCurrentUser();
      console.log('👤 User check result:', { hasUser: !!userResult?.user, userId: userResult?.user?.id });

      if (!userResult || !userResult.user) {
        console.warn('⚠️ User not authenticated, keeping local file only');
        return;
      }

      console.log('🌍 Starting upload to server with enhanced preloader...');
      
      // Use the enhanced file upload preloader
      const mediaUrl = await executeFileUpload(
        async () => {
          return await uploadMedia(file, userResult.user.id);
        },
        file.name,
        file.size,
        {
          canCancel: true,
          onCancel: () => {
            console.log('🛑 File upload cancelled by user');
            // Optionally clean up the preview if user cancels
            setFormData((prev) => {
              if (prev.mediaUrl && prev.mediaUrl.startsWith('blob:')) {
                URL.revokeObjectURL(prev.mediaUrl);
              }
              return { 
                ...prev, 
                media: undefined, 
                mediaUrl: undefined, 
                serverUrl: undefined 
              };
            });
            // Clear related state
            setTemplatedImageUrl("");
            setSelectedTemplate(undefined);
            setImageAnalysis("");
            setVideoThumbnailUrl("");
            setOriginalVideoFile(null);
            setVideoAspectRatio(null);
          }
        }
      );
      
      if (mediaUrl) {
        console.log('✅ Upload successful, URL:', mediaUrl);

        setFormData((prev) => {
          console.log('Adding URL to existing file. Previous:', { media: !!prev.media, mediaUrl: !!prev.mediaUrl });

          // Clean up the previous blob URL if it exists
          if (prev.mediaUrl && prev.mediaUrl.startsWith('blob:')) {
            URL.revokeObjectURL(prev.mediaUrl);
            console.log('🗑️ Cleaned up previous blob URL');
          }

          // Always use server URL for media (for publishing compatibility)
          // Use server URL as both mediaUrl and serverUrl for consistent publishing
          const newData = { ...prev, media: file, mediaUrl: mediaUrl, serverUrl: mediaUrl };
          console.log('Final formData with server URL:', { media: !!newData.media, mediaUrl: !!newData.mediaUrl, serverUrl: !!newData.serverUrl });
          return newData;
        });
        
        // Final state check
        setTimeout(() => {
          console.log('Final state after upload process:', {
            media: !!formData.media,
            mediaUrl: !!formData.mediaUrl,
            templatedImageUrl: !!templatedImageUrl,
            videoThumbnailUrl: !!videoThumbnailUrl,
            isVideo: isVideoFile(file),
            showPreview: !!(formData.media || formData.mediaUrl)
          });
          
          // Note: Template editor will open when user clicks Generate Post
          if (file.type.startsWith("image/")) {
            console.log('🖼️ Image uploaded successfully, template editor will open on Generate Post');
          } else if (isVideoFile(file)) {
            console.log('🎥 Video uploaded successfully, thumbnail generated, template editor will open on Generate Post');
          }
        }, 100);
      }
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      if (error instanceof Error) {
        console.log('📱 File should still be set for local preview, error was:', error.message);
      } else {
        console.log('📱 File should still be set for local preview, unknown error:', error);
      }
    }
  };

  const analyzeImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setAnalyzingImage(true);
    try {
      const base64 = await fileToBase64(file);

      console.log("Analyzing image with Gemini API...");

      // Call the Gemini analysis API with proper data URL format
      const dataUrl = `data:${file.type};base64,${base64}`;

      const apiUrl =
        import.meta.env.VITE_API_URL ||
        (typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.host}`
          : "http://localhost:5000/api");
      const response = await fetch(`${apiUrl}/ai/analyze-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: dataUrl,
          mimeType: file.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Analysis API error:", errorData);
        throw new Error(errorData.error || "Failed to analyze image");
      }

      const result = await response.json();
      console.log("Analysis result:", result);

      if (result.success && result.analysis) {
        setImageAnalysis(result.analysis);
        console.log("Image analysis completed successfully");
      } else {
        console.log("No analysis in result:", result);
        setImageAnalysis(
          "Image uploaded successfully. Add a description for better content generation.",
        );
      }
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      setImageAnalysis(
        `Image uploaded successfully. ${error.message?.includes("quota") ? "AI analysis quota exceeded." : "Add a description for better content generation."}`,
      );
    } finally {
      setAnalyzingImage(false);
    }
  };

  const analyzeImageFromUrl = async (imageUrl: string) => {
    setAnalyzingImage(true);
    try {
      console.log("Analyzing AI-generated image from URL with Gemini API...");

      // Fetch the image and convert to base64
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch image from URL");
      }

      const blob = await imageResponse.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === "string") {
            resolve(result.split(",")[1]); // Get base64 part
          } else {
            reject(new Error("FileReader result is not a string"));
          }
        };
        reader.onerror = (error) => reject(error);
      });

      // Call the Gemini analysis API with proper data URL format
      const dataUrl = `data:${blob.type};base64,${base64}`;

      const apiUrl =
        import.meta.env.VITE_API_URL ||
        (typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.host}`
          : "http://localhost:5000/api");
      const response = await fetch(`${apiUrl}/ai/analyze-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: dataUrl,
          mimeType: blob.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Analysis API error:", errorData);
        throw new Error(errorData.error || "Failed to analyze image");
      }

      const result = await response.json();
      console.log("Analysis result:", result);

      if (result.success && result.analysis) {
        setImageAnalysis(result.analysis);
        console.log("Image analysis completed successfully");
      } else {
        console.log("No analysis in result:", result);
        setImageAnalysis(
          "AI-generated image analyzed. Add a description for better content generation.",
        );
      }
    } catch (error: any) {
      console.error("Error analyzing AI-generated image:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      setImageAnalysis(
        `AI-generated image loaded successfully. ${error.message?.includes("quota") ? "AI analysis quota exceeded." : "Add a description for better content generation."}`,
      );
    } finally {
      setAnalyzingImage(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted with conditions:', {
      generateImageWithPost,
      selectedPostType,
      selectedImageMode,
      hasMediaUrl: !!formData.mediaUrl,
      promptLength: formData.prompt.trim().length
    });
    
    if (formData.prompt.trim()) {
      // For text-to-image mode with combined generation enabled, do the combined generation
      if (selectedPostType === 'image' && selectedImageMode === 'textToImage' && generateImageWithPost && !formData.mediaUrl) {
        console.log('🚀 Starting combined generation from Generate Post button...');
        await handleCombinedGenerationWithPost(formData.prompt);
        return; // Exit here as handleCombinedGenerationWithPost handles the rest
      }
      
      // For text-to-image mode without combined generation, check if image exists
      if (selectedPostType === 'image' && selectedImageMode === 'textToImage' && !generateImageWithPost && !formData.mediaUrl) {
        console.log('🎯 Image generation required - no image found');
        alert('Please generate an image first using the "Generate Image" button, then generate the post.');
        return;
      }

      // For upload mode, check if image is uploaded
      if (selectedPostType === 'image' && selectedImageMode === 'upload' && !formData.mediaUrl && !formData.media) {
        console.log('🎯 Image upload required');
        alert('Please upload an image first, then generate the post.');
        return;
      }
      
      // NEW: For uploaded images, open template editor directly with blank template
      if (selectedPostType === 'image' && selectedImageMode === 'upload' && (formData.media || formData.mediaUrl)) {
        console.log('🎨 Opening template editor for uploaded image with blank template...');
        
        // Get blank template
        const blankTemplate = getTemplateById('blank-template');
        if (blankTemplate) {
          console.log('📋 Setting blank template and opening editor');
          setSelectedTemplate(blankTemplate);
          setShowTemplateEditor(true);
          
          // Store post generation data for later use (similar to combined generation)
          const currentCampaignInfo = campaignInfo || {
            name: "Default Campaign",
            industry: "General",
            brand_tone: "professional",
            target_audience: "General",
            description: "General content generation without specific campaign context",
          };
          
          const postGenerationData = {
            prompt: formData.prompt,
            originalImageUrl: formData.mediaUrl,
            campaignInfo: currentCampaignInfo,
            selectedPlatforms: formData.selectedPlatforms,
            imageAnalysis,
            formData
          };
          
          setPendingPostGeneration(postGenerationData);
          return; // Exit here to wait for template editor completion
        } else {
          console.error('❌ Blank template not found, proceeding with normal flow');
        }
      }
      
      // NEW: For uploaded videos, generate thumbnail first then open template editor
      // Only for 16:9 and other aspect ratios that support thumbnails (not 9:16 stories)
      if (selectedPostType === 'video' && (selectedVideoMode === 'upload' || selectedVideoMode === 'uploadShorts') && originalVideoFile && !is9x16Video(videoAspectRatio || 0)) {
        console.log('🎥 Generating video thumbnail from content description, then opening template editor...');
        
        // Generate thumbnail using content description and aspect ratio
        const generatedThumbnailUrl = await generateThumbnailForPost(formData.prompt, videoAspectRatio);
        
        if (generatedThumbnailUrl) {
          console.log('✅ Video thumbnail generated successfully, opening template editor');
          
          // Get blank template
          const blankTemplate = getTemplateById('blank-template');
          if (blankTemplate) {
            console.log('📋 Setting blank template and opening editor for generated video thumbnail');
            setSelectedTemplate(blankTemplate);
            setShowTemplateEditor(true);
            
            // Store post generation data for later use, including original video file
            const currentCampaignInfo = campaignInfo || {
              name: "Default Campaign",
              industry: "General",
              brand_tone: "professional",
              target_audience: "General",
              description: "General content generation without specific campaign context",
            };
            
            const postGenerationData = {
              prompt: formData.prompt,
              originalImageUrl: generatedThumbnailUrl, // Use generated thumbnail for template editor
              originalVideoUrl: formData.mediaUrl, // Store original video URL
              originalVideoFile: originalVideoFile, // Store original video file
              videoAspectRatio: videoAspectRatio,
              isVideoContent: true, // Flag to indicate this is video content
              campaignInfo: currentCampaignInfo,
              selectedPlatforms: formData.selectedPlatforms,
              imageAnalysis: `Video thumbnail generated from content description for ${is16x9Video(videoAspectRatio || 0) ? '16:9 horizontal' : 'custom aspect ratio'} video`,
              formData
            };
            
            setPendingPostGeneration(postGenerationData);
            return; // Exit here to wait for template editor completion
          } else {
            console.error('❌ Blank template not found for video, proceeding with normal flow');
          }
        } else {
          console.error('❌ Failed to generate video thumbnail, proceeding with normal flow without thumbnail');
          // Continue with normal flow - video posts can work without thumbnails
        }
      }
      
      let currentFormData = formData; // Track the current form data state
      
      // Use fetched campaign info if available, otherwise use default values
      const currentCampaignInfo = campaignInfo || {
        name: "Default Campaign",
        industry: "General",
        brand_tone: "professional",
        target_audience: "General",
        description: "General content generation without specific campaign context",
      };

      console.log('Using campaign info:', {
        hasCampaign: !!campaignInfo,
        campaignInfo: currentCampaignInfo,
        fromContext: !!state.selectedCampaign
      });

      // Use the current form data (which should include the generated image)
      // For videos, ensure we use the server URL if available, not blob URLs
      const isVideoContent = !!(originalVideoFile || (currentFormData.media && isVideoFile(currentFormData.media)))
      
      console.log('🔍 Media URL determination debug:', {
        isVideoContent,
        hasServerUrl: !!currentFormData.serverUrl,
        hasMediaUrl: !!currentFormData.mediaUrl,
        hasTemplatedImage: !!templatedImageUrl,
        serverUrl: currentFormData.serverUrl?.substring(0, 80) + '...',
        mediaUrl: currentFormData.mediaUrl?.substring(0, 80) + '...',
        templatedImageUrl: templatedImageUrl?.substring(0, 80) + '...',
        shouldUseServerUrl: isVideoContent && currentFormData.serverUrl
      })
      
      // Prioritize templated image URL (from template editor) over other URLs
      const finalMediaUrlForAssets = templatedImageUrl ||
        (isVideoContent && currentFormData.serverUrl 
          ? currentFormData.serverUrl 
          : currentFormData.mediaUrl)
        
      const mediaAssets = finalMediaUrlForAssets
        ? [{ url: finalMediaUrlForAssets, type: isVideoContent ? "video" : (currentFormData.media?.type || "image") }]
        : [];

      console.log('📋 Final media assets for post data:', {
        mediaAssets,
        finalUrl: finalMediaUrlForAssets?.startsWith('blob:') ? 'blob URL (WRONG!)' : 'server URL (CORRECT)',
        fullUrl: finalMediaUrlForAssets?.substring(0, 80) + '...'
      });

      // For video content, ensure we override the mediaUrl with the server URL
      // For template-edited content, prioritize the templated image URL
      let finalPostData;
      if (templatedImageUrl) {
        // Use templated image URL (from template editor)
        finalPostData = {
          ...currentFormData,
          mediaUrl: templatedImageUrl,
          imageUrl: templatedImageUrl,
          serverUrl: templatedImageUrl // Ensure compatibility with publishing
        };
      } else if (isVideoContent && currentFormData.serverUrl) {
        finalPostData = {
          ...currentFormData,
          mediaUrl: currentFormData.serverUrl, // Override with server URL for videos
          imageUrl: currentFormData.serverUrl, // Also set imageUrl for compatibility
          videoUrl: currentFormData.serverUrl  // Also set videoUrl for video posts
        };
      } else {
        finalPostData = currentFormData;
      }
        
      const postData = {
        ...finalPostData, // Use the updated form data with proper URLs
        prompt: formData.prompt,
        selectedPlatforms: formData.selectedPlatforms,
        platforms: formData.selectedPlatforms,
        campaignName: currentCampaignInfo.name,
        campaignInfo: currentCampaignInfo,
        mediaAssets,
        analysisResults: imageAnalysis,
        industry: currentCampaignInfo.industry,
        tone: currentCampaignInfo.brand_tone || currentCampaignInfo.brandTone,
        targetAudience: currentCampaignInfo.target_audience || currentCampaignInfo.targetAudience,
        description: currentCampaignInfo.description,
        imageAnalysis: imageAnalysis,
        // Additional campaign fields if available
        website: currentCampaignInfo.website,
        objective: currentCampaignInfo.objective,
        goals: currentCampaignInfo.goals,
        keywords: currentCampaignInfo.keywords,
        hashtags: currentCampaignInfo.hashtags,
      };
      
      console.log('📤 Final postData debug:', {
        mediaUrl: postData.mediaUrl?.startsWith('blob:') ? 'blob URL (WRONG!)' : 'server URL (CORRECT)',
        imageUrl: postData.imageUrl?.startsWith('blob:') ? 'blob URL (WRONG!)' : 'server URL (CORRECT)',
        videoUrl: postData.videoUrl?.startsWith('blob:') ? 'blob URL (WRONG!)' : 'server URL (CORRECT)',
        mediaUrlFull: postData.mediaUrl?.substring(0, 80) + '...',
        hasMediaAssets: mediaAssets.length > 0
      });

      console.log('📤 Final post data being sent:', {
        hasMediaAssets: mediaAssets.length > 0,
        mediaAssetsCount: mediaAssets.length,
        prompt: postData.prompt?.substring(0, 50) + '...'
      });

      // If onNext callback is provided, use it
      if (onNext && typeof onNext === "function") {
        onNext(postData);
      } else {
        // Otherwise, simulate generation for preview
        // For videos, ensure we use the server URL if available, not blob URLs
        // For template-edited content, prioritize the templated image URL
        const isVideoContent = !!(originalVideoFile || (currentFormData.media && isVideoFile(currentFormData.media)))
        const finalMediaUrl = templatedImageUrl ||
          (isVideoContent && currentFormData.serverUrl 
            ? currentFormData.serverUrl 
            : currentFormData.mediaUrl)
        
        console.log('🎬 Video preview generation:', {
          isVideoContent,
          hasServerUrl: !!currentFormData.serverUrl,
          hasMediaUrl: !!currentFormData.mediaUrl,
          serverUrl: currentFormData.serverUrl?.substring(0, 50) + '...',
          mediaUrl: currentFormData.mediaUrl?.substring(0, 50) + '...',
          finalUrl: finalMediaUrl?.startsWith('blob:') ? 'blob URL (WRONG)' : 'server URL (CORRECT)',
          videoAspectRatio
        })
        
        const simulatedGeneratedPosts = [
          {
            platform: (formData.selectedPlatforms && formData.selectedPlatforms[0]) || "linkedin",
            content: formData.prompt,
            caption: formData.prompt,
            hashtags: formData.tags,
            mediaUrl: finalMediaUrl,
            imageUrl: finalMediaUrl,
            videoUrl: isVideoContent ? finalMediaUrl : undefined, // Add explicit videoUrl for video content
            thumbnailUrl: templatedImageUrl || (currentFormData as any).thumbnailUrl, // Use templated image as poster for videos
            isVideoContent: isVideoContent,
            videoAspectRatio: videoAspectRatio,
            engagement: Math.floor(Math.random() * 1000),
          },
        ];
        setGeneratedResults(simulatedGeneratedPosts);
        setShowPreview(true);
      }
    }
  };

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms?.includes(platform as Platform)
        ? prev.selectedPlatforms.filter((p) => p !== platform)
        : [...(prev.selectedPlatforms || []), platform as Platform],
    }));
  };

  const useImageAnalysis = () => {
    setFormData((prev) => ({
      ...prev,
      prompt:
        prev.prompt +
        (prev.prompt ? "\n\n" : "") +
        `Image Analysis: ${imageAnalysis}`,
    }));
    setImageAnalysis("");
  };

  const performAIAnalysis = async () => {
    if (formData.media && formData.media.type.startsWith("image/")) {
      // Analyze uploaded image file
      await analyzeImage(formData.media);
    } else if (formData.mediaUrl && !formData.media && !formData.mediaUrl.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv|m4v)$/i)) {
      // Analyze AI-generated image from URL
      await analyzeImageFromUrl(formData.mediaUrl);
    }
  };

  const handleAIImageGenerated = async (imageUrl: string, shouldAutoOpenTemplate: boolean = true) => {
    console.log('🖼️ handleAIImageGenerated called with URL:', imageUrl);
    try {
      // Convert the AI generated image URL to a File object
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "ai-generated-image.png", {
        type: "image/png",
      });
      console.log('📋 Created File object:', { name: file.name, size: file.size, type: file.type });

      // Upload the AI generated image to our storage
      const user = await getCurrentUser();
      if (user && user.user?.id) {
        console.log('📤 Uploading to storage for user:', user.user.id);
        const mediaUrl = await uploadMedia(file, user.user.id);
        console.log('✅ Upload successful, server URL:', mediaUrl);
        
        setFormData((prev) => {
        console.log('🔄 Updating formData with server URL - before:', { 
          hasMedia: !!prev.media, 
          hasMediaUrl: !!prev.mediaUrl 
        });
        const newData = { ...prev, media: file, mediaUrl, serverUrl: mediaUrl };
        console.log('🔄 Updating formData with server URL - after:', { 
          hasMedia: !!newData.media, 
          hasMediaUrl: !!newData.mediaUrl,
          hasServerUrl: !!newData.serverUrl,
          mediaUrl: newData.mediaUrl?.substring(0, 50) + '...' 
        });
        return newData;
        });
        
        // Auto-open template editor with blank template only if requested
        if (shouldAutoOpenTemplate) {
          console.log('🎨 Auto-opening template editor with blank template for AI generated image');
          // Get blank template
          const blankTemplate = getTemplateById('blank-template');
          if (blankTemplate) {
            console.log('📋 Setting blank template and opening editor for AI image');
            setTimeout(() => {
              setSelectedTemplate(blankTemplate);
              setShowTemplateEditor(true);
            }, 500); // Small delay to ensure state is updated
          } else {
            console.error('❌ Blank template not found for AI image - this should not happen!');
            // Don't open anything if blank template is missing - this is a critical error
          }
        }
      } else {
        console.log('⚠️ No authenticated user, using direct URL');
        // If no user, just use the direct URL
        setFormData((prev) => {
          console.log('🔄 Updating formData with direct URL - before:', { 
            hasMedia: !!prev.media, 
            hasMediaUrl: !!prev.mediaUrl 
          });
          const newData = { ...prev, mediaUrl: imageUrl };
          console.log('🔄 Updating formData with direct URL - after:', { 
            hasMedia: !!newData.media, 
            hasMediaUrl: !!newData.mediaUrl,
            mediaUrl: newData.mediaUrl?.substring(0, 50) + '...' 
          });
          return newData;
        });
        
        // Auto-open template editor with blank template only if requested
        if (shouldAutoOpenTemplate) {
          console.log('🎨 Auto-opening template editor with blank template for AI generated image (no auth)');
          // Get blank template
          const blankTemplate = getTemplateById('blank-template');
          if (blankTemplate) {
            console.log('📋 Setting blank template and opening editor for AI image (no auth)');
            setTimeout(() => {
              setSelectedTemplate(blankTemplate);
              setShowTemplateEditor(true);
            }, 500); // Small delay to ensure state is updated
          } else {
            console.error('❌ Blank template not found for AI image (no auth) - this should not happen!');
            // Don't open anything if blank template is missing - this is a critical error
          }
        }
      }
    } catch (error) {
      console.error("❌ Error handling AI generated image:", error);
      // Fallback: just use the URL directly
      console.log('🔄 Using fallback direct URL');
      setFormData((prev) => {
        console.log('🔄 Fallback update - before:', { 
          hasMedia: !!prev.media, 
          hasMediaUrl: !!prev.mediaUrl 
        });
        const newData = { ...prev, mediaUrl: imageUrl };
        console.log('🔄 Fallback update - after:', { 
          hasMedia: !!newData.media, 
          hasMediaUrl: !!newData.mediaUrl,
          mediaUrl: newData.mediaUrl?.substring(0, 50) + '...' 
        });
        return newData;
      });
      
      // Auto-open template editor with blank template only if requested
      if (shouldAutoOpenTemplate) {
        console.log('🎨 Auto-opening template editor with blank template for fallback image');
        // Get blank template
        const blankTemplate = getTemplateById('blank-template');
        if (blankTemplate) {
          console.log('📋 Setting blank template and opening editor for fallback image');
          setTimeout(() => {
            setSelectedTemplate(blankTemplate);
            setShowTemplateEditor(true);
          }, 500); // Small delay to ensure state is updated
        } else {
          console.error('❌ Blank template not found for fallback image - this should not happen!');
          // Don't open anything if blank template is missing - this is a critical error
        }
      }
    }
  };

  const handleNext = () => {
    if (generatedResults && generatedResults.length > 0) {
      setShowPreview(true);
    }
  };

  // Template handler functions
  const handleTemplateSelect = (template: Template) => {
    console.log('Template selected:', template.name);
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    setShowTemplateEditor(true);
  };

  const handleTemplateEditorSave = async (imageUrl: string) => {
    console.log('Template editor saved with image URL:', imageUrl);
    setTemplatedImageUrl(imageUrl);
    setFormData((prev) => ({ ...prev, mediaUrl: imageUrl }));
    setShowTemplateEditor(false);
    
    // Check if we have pending post generation (from combined generation workflow)
    if (pendingPostGeneration) {
      console.log('🚀 Continuing post generation with templated image...');
      
      const { 
        prompt, 
        campaignInfo: currentCampaignInfo, 
        selectedPlatforms, 
        imageAnalysis, 
        formData: originalFormData,
        isVideoContent,
        originalVideoUrl,
        originalVideoFile,
        videoAspectRatio
      } = pendingPostGeneration;
      
      // Prepare final form data
      let currentFormData;
      let mediaAssets;
      
      if (isVideoContent && originalVideoUrl) {
        console.log('📹 Processing video content with edited thumbnail...');
        // For video content, keep the original video URL but use the edited thumbnail
        currentFormData = {
          ...originalFormData,
          mediaUrl: originalVideoUrl, // Keep original video URL for publishing
          thumbnailUrl: imageUrl, // Store edited thumbnail separately
          videoFile: originalVideoFile, // Keep original video file
          videoAspectRatio: videoAspectRatio
        };
        
        // Create media assets with both video and thumbnail
        mediaAssets = [
          { 
            url: originalVideoUrl, 
            type: "video",
            thumbnailUrl: imageUrl, // Edited thumbnail
            aspectRatio: videoAspectRatio
          }
        ];
        
        console.log('📋 Video media assets prepared:', {
          videoUrl: originalVideoUrl?.substring(0, 50) + '...',
          thumbnailUrl: imageUrl?.substring(0, 50) + '...',
          aspectRatio: videoAspectRatio
        });
      } else {
        console.log('🖼️ Processing image content with templated image...');
        // For image content, use the templated image
        currentFormData = {
          ...originalFormData,
          mediaUrl: imageUrl // Use the templated image URL
        };
        
        mediaAssets = [{ url: imageUrl, type: "image" }];
      }
      
      console.log('📋 Preparing final post data:', {
        hasMediaAssets: mediaAssets.length > 0,
        mediaType: isVideoContent ? 'video' : 'image',
        prompt: prompt.substring(0, 50) + '...'
      });
      
      const postData = {
        ...currentFormData,
        prompt: prompt,
        selectedPlatforms: selectedPlatforms,
        platforms: selectedPlatforms,
        campaignName: currentCampaignInfo.name,
        campaignInfo: currentCampaignInfo,
        mediaAssets,
        analysisResults: imageAnalysis,
        industry: currentCampaignInfo.industry,
        tone: currentCampaignInfo.brand_tone || currentCampaignInfo.brandTone,
        targetAudience: currentCampaignInfo.target_audience || currentCampaignInfo.targetAudience,
        description: currentCampaignInfo.description,
        imageAnalysis: imageAnalysis,
        website: currentCampaignInfo.website,
        objective: currentCampaignInfo.objective,
        goals: currentCampaignInfo.goals,
        keywords: currentCampaignInfo.keywords,
        hashtags: currentCampaignInfo.hashtags,
        // Add video-specific metadata if applicable
        ...(isVideoContent && {
          isVideoContent: true,
          videoAspectRatio: videoAspectRatio,
          originalVideoFile: originalVideoFile
        })
      };
      
      console.log('📤 Final post data:', {
        hasMediaAssets: mediaAssets.length > 0,
        mediaAssetsCount: mediaAssets.length,
        isVideo: isVideoContent,
        prompt: postData.prompt?.substring(0, 50) + '...'
      });
      
      // Clear pending post generation
      setPendingPostGeneration(null);
      setIsGeneratingBoth(false);
      
      // Proceed with post generation
      if (onNext && typeof onNext === "function") {
        console.log('✅ Final step: Calling onNext with final post data...');
        onNext(postData);
        console.log('✅ Template editing completed!');
      } else {
        console.log('⚠️ No onNext function provided, showing preview instead');
        // Fallback: simulate generation for preview
        const simulatedGeneratedPosts = [
          {
            platform: (selectedPlatforms && selectedPlatforms[0]) || "linkedin",
            content: prompt,
            caption: prompt,
            hashtags: originalFormData.tags,
            engagement: Math.floor(Math.random() * 1000),
          },
        ];
        setGeneratedResults(simulatedGeneratedPosts);
        setShowPreview(true);
      }
    } else {
      // Standalone template application - navigate to generation screen if user has content
      console.log('🎯 Standalone template applied. Checking if user has content to proceed...');
      
      if (formData.prompt && formData.prompt.trim()) {
        console.log('✅ User has content, proceeding to post generation after template application');
        
        // Prepare the post data with the templated image
        const currentCampaignInfo = campaignInfo || {
          name: "Default Campaign",
          industry: "General", 
          brand_tone: "professional",
          target_audience: "General",
          description: "General content generation without specific campaign context",
        };
        
        // Check if this is video content (based on current video state)
        const isCurrentVideoContent = originalVideoFile && videoThumbnailUrl;
        
        let postData;
        if (isCurrentVideoContent) {
          // For video content, use original video URL but edited thumbnail
          postData = {
            ...formData,
            mediaUrl: formData.mediaUrl, // Keep original video URL
            thumbnailUrl: imageUrl, // Use edited thumbnail
            videoFile: originalVideoFile,
            videoAspectRatio: videoAspectRatio,
            isVideoContent: true,
            campaignName: currentCampaignInfo.name,
            campaignInfo: currentCampaignInfo,
            mediaAssets: [{ 
              url: formData.mediaUrl, 
              type: "video",
              thumbnailUrl: imageUrl,
              aspectRatio: videoAspectRatio
            }],
            industry: currentCampaignInfo.industry,
            tone: currentCampaignInfo.brand_tone || currentCampaignInfo.brandTone,
            targetAudience: currentCampaignInfo.target_audience || currentCampaignInfo.targetAudience,
            description: currentCampaignInfo.description,
            imageAnalysis: imageAnalysis,
            website: currentCampaignInfo.website,
            objective: currentCampaignInfo.objective,
            goals: currentCampaignInfo.goals,
            keywords: currentCampaignInfo.keywords,
            hashtags: currentCampaignInfo.hashtags,
          };
        } else {
          // For image content, use templated image
          postData = {
            ...formData,
            mediaUrl: imageUrl, // Use the templated image URL
            campaignName: currentCampaignInfo.name,
            campaignInfo: currentCampaignInfo,
            mediaAssets: [{ url: imageUrl, type: "image" }],
            industry: currentCampaignInfo.industry,
            tone: currentCampaignInfo.brand_tone || currentCampaignInfo.brandTone,
            targetAudience: currentCampaignInfo.target_audience || currentCampaignInfo.targetAudience,
            description: currentCampaignInfo.description,
            imageAnalysis: imageAnalysis,
            website: currentCampaignInfo.website,
            objective: currentCampaignInfo.objective,
            goals: currentCampaignInfo.goals,
            keywords: currentCampaignInfo.keywords,
            hashtags: currentCampaignInfo.hashtags,
          };
        }
        
        console.log('🚀 Navigating to post generation with templated content');
        
        // Navigate to the generation screen
        if (onNext && typeof onNext === "function") {
          onNext(postData);
        }
      } else {
        console.log('⚠️ No content provided - template applied but staying on current screen');
      }
    }
  };

  const handleTemplateEditorCancel = () => {
    setShowTemplateEditor(false);
    setSelectedTemplate(undefined);
    
    // If we have pending post generation, cancel it and reset state
    if (pendingPostGeneration) {
      console.log('❌ Template editor cancelled, aborting post generation');
      setPendingPostGeneration(null);
      setIsGeneratingBoth(false);
    }
    
    // If we were in video mode, return to video upload
    if (selectedPostType === 'video') {
      console.log('🎬 Returning to video upload mode after template editor cancel');
      setSelectedVideoMode('upload');
      // Clear any templated content and return to original video state
      setTemplatedImageUrl("");
      if (originalVideoFile && formData.mediaUrl) {
        // Keep the original video file and URL
        console.log('📹 Restoring original video state');
      }
    }
  };

  const handleTemplateSelectorCancel = () => {
    setShowTemplateSelector(false);
    
    // If we have pending post generation, cancel it and reset state
    if (pendingPostGeneration) {
      console.log('❌ Template selector cancelled, aborting post generation');
      setPendingPostGeneration(null);
      setIsGeneratingBoth(false);
    }
  };

  const handleEditTemplate = () => {
    if (templatedImageUrl && selectedTemplate) {
      setShowTemplateEditor(true);
    }
  };

  const handleDeleteTemplate = () => {
    setTemplatedImageUrl("");
    setSelectedTemplate(undefined);
    // Reset to original image if available
    setFormData((prev) => ({ ...prev, mediaUrl: prev.media ? URL.createObjectURL(prev.media) : undefined }));
  };

  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageDescription, setImageDescription] = useState<string>('');
  const [generateImageWithPost, setGenerateImageWithPost] = useState(true );
  const [isGeneratingBoth, setIsGeneratingBoth] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Video-related state
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string>("");
  const [originalVideoFile, setOriginalVideoFile] = useState<File | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);

  const handleAspectRatioChange = (newAspectRatio: string) => {
    setAspectRatio(newAspectRatio);
  };

  // Generate AI thumbnail for video when Generate Post is clicked
  const generateThumbnailForPost = async (contentDescription: string, aspectRatio: number | null): Promise<string | null> => {
    setIsGeneratingThumbnail(true);
    try {
      return await executeVideoThumbnailGeneration(
        async () => {
        console.log('🎨 Generating video thumbnail from content description:', contentDescription.substring(0, 100) + '...');
        console.log('📐 Input video aspect ratio:', aspectRatio);

        const apiUrl = import.meta.env.VITE_API_URL ||
          (typeof window !== "undefined"
            ? `${window.location.protocol}//${window.location.host}`
            : "http://localhost:5000/api");

        // Force 16:9 thumbnails regardless of input aspect ratio
        const targetAspectRatio = '16:9';
        const aspectRatioDescription = '16:9 horizontal/landscape format (forced)';
        console.log('📐 Forcing thumbnail aspect ratio to 16:9');

        // Enhanced thumbnail prompt with content description and aspect ratio context
        const thumbnailPrompt = `Create a compelling video thumbnail for ${aspectRatioDescription} video about: ${contentDescription.trim()}. Make it eye-catching, professional, and suitable for social media platforms. Include relevant visual elements that represent the content. Do not include any text, words, letters, numbers, captions, watermarks, logos, or typography. Pure imagery only.`;

        console.log('📝 Thumbnail prompt:', thumbnailPrompt);
        console.log('📐 Final target aspect ratio:', targetAspectRatio, '(' + aspectRatioDescription + ')');

        const requestBody = {
          prompt: thumbnailPrompt,
          style: 'professional',
          aspectRatio: targetAspectRatio,
          quality: 'standard',
          model: 'gemini-2.5-flash-image-preview'
        };
        
        console.log('📋 Request body for thumbnail generation:', requestBody);

        const response = await fetch(`${apiUrl}/ai/generate-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Thumbnail generation API error:', errorText);
          throw new Error(`Failed to generate video thumbnail: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success || !result.imageUrl) {
          throw new Error(result.error || 'Video thumbnail generation failed');
        }

        console.log('✅ Video thumbnail generated successfully');

        // Try to upload generated thumbnail to our storage for a stable URL
        try {
          const user = await getCurrentUser();
          if (user?.user?.id) {
            const imgResp = await fetch(result.imageUrl);
            const blob = await imgResp.blob();
            const file = new File([blob], `video-thumbnail-${Date.now()}.png`, { type: 'image/png' });
            const uploadedUrl = await uploadMedia(file, user.user.id);
            console.log('📤 Video thumbnail uploaded to storage:', uploadedUrl);
            setVideoThumbnailUrl(uploadedUrl);
            return uploadedUrl;
          }
        } catch (uploadErr) {
          console.warn('Failed to upload video thumbnail, using direct URL:', uploadErr);
        }

        setVideoThumbnailUrl(result.imageUrl);
        return result.imageUrl;
      },
      'Generating video thumbnail from content description'
    );
    } catch (error) {
      console.error('❌ Error in generateThumbnailForPost:', error);
      return null;
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  // Inline image generation function
  const handleGenerateImage = async () => {
    if (!imageDescription.trim()) return;
    
    setIsGeneratingImage(true);
    try {
      const result = await executeImageGeneration(
        async () => {
        const apiUrl = import.meta.env.VITE_API_URL || 
          (typeof window !== "undefined" 
            ? `${window.location.protocol}//${window.location.host}` 
            : "http://localhost:5000/api");
        
        const response = await fetch(`${apiUrl}/ai/generate-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: `${imageDescription.trim()}. Do not include any text, words, letters, numbers, captions, watermarks, logos, or typography. Pure imagery only.`,
            style: 'professional',
            aspectRatio: aspectRatio,
            quality: 'standard',
            model: 'gemini-2.5-flash-image-preview'
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate image');
        }
        
        const result = await response.json();
        console.log('🎨 Image generation API response:', result);
        if (result.success && result.imageUrl) {
          await handleAIImageGenerated(result.imageUrl);
          setImageDescription(''); // Clear the description field
          return result;
        } else {
          throw new Error(result.error || 'Image generation failed');
        }
      },
      'Creating your custom image'
    );
    } catch (error) {
      console.error('❌ Error in handleGenerateImage:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Combined generation function - generates both post and image from main prompt
  const handleCombinedGeneration = async (prompt: string, shouldAutoOpenTemplate: boolean = true): Promise<string | null> => {
    return await executeImageGeneration(
      async () => {
        console.log('🖼️ Combined generation started with prompt:', prompt.substring(0, 100) + '...');
        
        const apiUrl = import.meta.env.VITE_API_URL || 
          (typeof window !== "undefined" 
            ? `${window.location.protocol}//${window.location.host}` 
            : "http://localhost:5000/api");
        
        console.log('🌍 API URL for image generation:', apiUrl);
        
        const requestBody = {
          prompt: `${prompt}. Do not include any text, words, letters, numbers, captions, watermarks, logos, or typography. Pure imagery only.`,
          style: 'professional',
          aspectRatio: aspectRatio,
          quality: 'standard',
          model: 'gemini-2.5-flash-image-preview'
        };
        
        console.log('📝 Request body:', requestBody);
        
        const response = await fetch(`${apiUrl}/ai/generate-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('🚀 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response error:', errorText);
          throw new Error(`Failed to generate image: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        console.log('🎨 Image generation result:', result);
        
        if (result.success && result.imageUrl) {
          console.log('✅ Image generated successfully, processing...', result.imageUrl);
          await handleAIImageGenerated(result.imageUrl, shouldAutoOpenTemplate);
          console.log('✅ Combined generation completed successfully!');
          return result.imageUrl;
        } else {
          console.error('❌ Image generation result invalid:', result);
          throw new Error(result.error || 'Image generation failed - no image URL in response');
        }
      },
      'Generating image from content'
    );
  };

  // State to hold pending post generation data
  const [pendingPostGeneration, setPendingPostGeneration] = useState<any>(null);
  
  // Enhanced combined generation function - generates image and waits for template editor completion
  const handleCombinedGenerationWithPost = async (prompt: string) => {
    setIsGeneratingBoth(true);
    try {
      console.log('🚀 Starting combined generation with template editor workflow...');
      console.log('📝 Prompt for combined generation:', prompt.substring(0, 100) + '...');
      
      // Step 1: Generate the image (but don't auto-open template selector yet)
      console.log('🖼️ Step 1: Generating image from content...');
      const imageUrl = await handleCombinedGeneration(prompt, false); // Don't auto-open template
      
      if (!imageUrl) {
        console.error('❌ Image generation failed, cannot proceed with post generation');
        throw new Error('Image generation failed');
      }
      
      console.log('✅ Step 1 completed: Image generated successfully');
      
      // Store the post generation data to be used after template editor
      const currentCampaignInfo = campaignInfo || {
        name: "Default Campaign",
        industry: "General",
        brand_tone: "professional",
        target_audience: "General",
        description: "General content generation without specific campaign context",
      };
      
      const postGenerationData = {
        prompt,
        originalImageUrl: imageUrl,
        campaignInfo: currentCampaignInfo,
        selectedPlatforms: formData.selectedPlatforms,
        imageAnalysis,
        formData
      };
      
      console.log('💾 Storing post generation data for later use');
      setPendingPostGeneration(postGenerationData);
      
      // Step 2: Open template editor directly with blank template and wait for user to complete editing
      console.log('🎨 Step 2: Opening template editor with blank template - waiting for user to complete editing...');
      // Get blank template
      const blankTemplate = getTemplateById('blank-template');
      if (blankTemplate) {
        console.log('📋 Setting blank template and opening editor for combined generation');
        setTimeout(() => {
          setSelectedTemplate(blankTemplate);
          setShowTemplateEditor(true);
        }, 500);
      } else {
        console.error('❌ Blank template not found for combined generation - this should not happen!');
        // This is a critical error - the blank template should always exist
        setIsGeneratingBoth(false);
        throw new Error('Blank template not found - cannot proceed with template editing');
      }
      
      // The post generation will continue when handleTemplateEditorSave is called
      
    } catch (error) {
      console.error('❌ Error in combined generation with post:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message, error.stack);
        alert(`Failed to generate image: ${error.message}`);
      }
      setIsGeneratingBoth(false);
    }
    // Don't set setIsGeneratingBoth(false) here - it will be set after template editor completion
  };

  return (
    <div className="w-full mx-auto  rounded-xl border border-white/10 p-2 m0 ">
      {/* Hide the main form when template editor is open */}
      {!showTemplateEditor && (
        <>
          {/* Header */}
          <div className="text-left mb-4">
            {/* <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mx-auto ">
              <Wand2 className="w-6 h-6 text-blue-400" />
            </div> */}
            <h2 className="text-3xl font-semibold theme-text-primary mb-1">
              Create auto‑optimize social posts with AI
            </h2>
            <p className="text-sm theme-text-primary">
              Generate on‑brand content, auto‑design visuals, and
              publish everywhere in one click. Meet your new 24/7
              content teammate.
            </p>

        {/* Campaign Context Indicator */}
        {/* {loadingCampaign && (
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-blue-400">
            <Loader className="w-3 h-3 animate-spin" />
            <span>Loading campaign info...</span>
          </div>
        )}
        {campaignInfo && (
          <div className="flex items-center justify-center gap-2 mt-3 px-3 py-1 bg-green-500/10 border border-green-400/20 rounded-full text-xs text-green-300">
            <Target className="w-3 h-3" />
            <span>Using campaign: {campaignInfo.name}</span>
          </div>
        )}
        {!campaignInfo && !loadingCampaign && state.selectedCampaign && (
          <div className="flex items-center justify-center gap-2 mt-3 px-3 py-1 bg-yellow-500/10 border border-yellow-400/20 rounded-full text-xs text-yellow-300">
            <AlertCircle className="w-3 h-3" />
            <span>Campaign not found - using default settings</span>
          </div>
        )}
        {!campaignInfo && !state.selectedCampaign && (
          <div className="flex items-center justify-center gap-2 mt-3 px-3 py-1 bg-gray-500/10 border border-gray-400/20 rounded-full text-xs text-gray-400">
            <span>No campaign selected - using general content generation</span>
          </div>
        )} */}
      </div>
      
      {/* TEMPORARY: Loading Test Section - Remove this after testing */}
      {/* <LoadingTest /> */}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-0 ">
          {/* Left Column - Post Type Selection */}
          <div className="space-y-3 mb-2">
            {/* Post Type Selection */}
            <div className="z-50 ">
              <label className="block text-sm font-medium theme-text-primary mb-1">
                Select Post Type
              </label>
              <div className="grid grid-cols-3 gap-2 ">
                {/* Text Post */}
                <button
                  type="button"
                  onClick={() => setSelectedPostType('text')}
                  disabled={(formData.media || formData.mediaUrl) && selectedPostType !== 'text'}
                  className={`  border transition-all duration-200 text-center p-3 ${
                    (formData.media || formData.mediaUrl) && selectedPostType !== 'text'
                      ? 'theme-bg-primary opacity-50 cursor-not-allowed'
                      : selectedPostType === 'text'
                      ? 'theme-bg-trinary theme-text-light shadow-lg'
                      : 'theme-bg-primary '
                    }`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`  `}>
                      <Icon name="text-post" size={44} className={`${selectedPostType === 'text'
                          ? 'brightness-0 invert '
                          : 'theme-text-secondary'
                        }`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-md leading-none ${selectedPostType === 'text'
                          ? 'text-white'
                          : 'theme-text-primary'
                        }`}>
                        Create<br />Text Post
                      </h3>
                    </div>
                  </div>
                </button>
                    


                {/* Image Post */}
                <button
                  type="button"
                  onClick={() => {
                    if (!((formData.media || formData.mediaUrl) && selectedPostType !== 'image')) {
                      setSelectedPostType('image')
                      setShowImageMenu(!showImageMenu);
                    }
                  }}
                  disabled={(formData.media || formData.mediaUrl) && selectedPostType !== 'image' && !formData.media?.type?.startsWith('image/')}
                  className={` relative  border transition-all duration-200 text-center p-3 ${
                    (formData.media || formData.mediaUrl) && selectedPostType !== 'image' && !formData.media?.type?.startsWith('image/')
                      ? 'theme-bg-primary opacity-50 cursor-not-allowed'
                      : selectedPostType === 'image'
                      ? 'theme-bg-trinary theme-text-light shadow-lg'
                      : 'theme-bg-primary theme-text-primary'
                    }`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`  `}>
                      <Icon name="image-post" size={48} className={`${selectedPostType === 'image'
                          ? 'brightness-0 invert '
                          : 'theme-text-secondary'
                        }`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-md leading-none p-0 ${selectedPostType === 'image'
                          ? 'text-white'
                          : 'theme-text-primary'
                        }`}>
                        Create
                        <br />Image Post
                      </h3>
                    </div>
                  </div>
                  <div className={`absolute w-full left-0 mt-3 z-10 ${showImageMenu ? '' : 'hidden'}`}>
                    <div className={`grid grid-cols-1 gap-0 ${showImageMenu ? '' : 'hidden'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageMode('upload');
                          setShowImageMenu(false);
                        }}
                        className={`p-3  border transition-all duration-200 text-center
                        ${selectedPostType === 'image'
                            ? ''
                            : 'hidden'
                          }
                        ${selectedImageMode === 'upload'
                            ? 'theme-bg-trinary text-white shadow-lg'
                            : 'theme-bg-quaternary'
                          }`}
                      >
                        <div className="flex flex-col items-center space-y-0">
                          <div>
                            <Icon name="upload" size={40} className={`${selectedImageMode === 'upload'
                                ? 'brightness-0 invert'
                                : ''
                              }`} />
                          </div>
                          <div>
                            <h3 className={`font-semibold text-sm leading-none
                        
                        ${selectedImageMode === 'upload'
                                ? 'text-white'
                                : 'theme-text-secondary'
                              }`}>
                              Upload<br />Image
                            </h3>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageMode('textToImage');
                          setShowImageMenu(false);
                        }}
                        className={`p-3  border transition-all duration-200 text-center 
                        ${selectedPostType === 'image'
                            ? ''
                            : 'hidden'
                          }
                        ${selectedImageMode === 'textToImage'
                            ? 'theme-bg-trinary text-white shadow-lg'
                            : 'theme-bg-quaternary'
                          }`}
                      >
                        <div className="flex flex-col items-center space-y-0">
                          <div>
                            <Icon name="text-to-image" size={44} className={`${selectedImageMode === 'textToImage'
                                ? 'brightness-0 invert'
                                : ''
                              }`} />
                          </div>
                          <div>
                            <h3 className={`font-semibold text-sm leading-none ${selectedImageMode === 'textToImage'
                                ? 'text-white'
                                : 'theme-text-secondary'
                              }`}>
                              Text<br /> to Image
                            </h3>
                          </div>
                        </div>
                      </button>
                    </div>


                  </div>
                </button>


                {/* Video Post */}
                <button
                  type="button"
                  onClick={() => {
                    if (!((formData.media || formData.mediaUrl) && selectedPostType !== 'video')) {
                      setSelectedPostType('video');
                      setShowVideoMenu(!showVideoMenu);
                    }
                  }}
                  disabled={(formData.media || formData.mediaUrl) && selectedPostType !== 'video' && !isVideoFile(formData.media)}
                  className={`relative border transition-all duration-200 text-center p-3 ${
                    (formData.media || formData.mediaUrl) && selectedPostType !== 'video' && !isVideoFile(formData.media)
                      ? 'theme-bg-primary opacity-50 cursor-not-allowed'
                      : selectedPostType === 'video'
                      ? 'theme-bg-trinary theme-text-light shadow-lg'
                      : 'theme-bg-primary theme-text-primary'
                    }`}
                >
                  <div className="flex flex-col items-center">
                    <div>
                      <Icon name="video-post" size={48} className={`${selectedPostType === 'video'
                          ? 'brightness-0 invert '
                          : 'theme-text-secondary'
                        }`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-md leading-none p-0 ${selectedPostType === 'video'
                          ? 'text-white'
                          : 'theme-text-primary'
                        }`}>
                        Create<br />Video Post
                      </h3>
                    </div>
                  </div>
                  <div className={`absolute w-full left-0 mt-3 z-10 ${showVideoMenu ? '' : 'hidden'}`}>
                    <div className={`grid grid-cols-1 gap-0 ${showVideoMenu ? '' : 'hidden'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVideoMode('upload');
                          setShowVideoMenu(false);
                        }}
                        className={`p-3 border transition-all duration-200 text-center
                            ${selectedPostType === 'video' ? '' : 'hidden'}
                            ${selectedVideoMode === 'upload' ? 'theme-bg-trinary text-white shadow-lg' : 'theme-bg-quaternary'}
                          `}
                      >
                        <div className="flex flex-col items-center space-y-0">
                          <div>
                             <div className={`w-10 h-6 border mx-auto mb-2  ${selectedVideoMode === 'upload'
                                ? 'shadow-lg brightness-0 invert border-2'
                                : 'theme-border-trinary border-2'
                              }`}></div>
                          </div>
                          <div>
                            <h3 className={`font-semibold text-sm leading-none ${selectedVideoMode === 'upload' ? 'text-white' : 'theme-text-secondary'
                              }`}>
                              Upload<br />Video
                            </h3>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVideoMode('uploadShorts');
                          setShowVideoMenu(false);
                        }}
                        className={`p-3 border transition-all duration-200 text-center
                            ${selectedPostType === 'video' ? '' : 'hidden'}
                            ${selectedVideoMode === 'uploadShorts' ? 'theme-bg-trinary text-white shadow-lg' : 'theme-bg-quaternary'}
                          `}
                      >
                        <div className="flex flex-col items-center space-y-0">
                          <div>
                            {/* Fallback to video-post icon if text-to-video is not available */}
                            {/* <Icon name="video-post" size={44} className={`${selectedVideoMode === 'uploadShorts' ? 'brightness-0 invert' : ''}`} /> */}

                            <div className={`w-6 h-10 border mx-auto mb-2  ${selectedVideoMode === 'uploadShorts'
                                ? 'shadow-lg brightness-0 invert border-2'
                                : 'theme-border-trinary border-2'
                              }`}></div>
                          </div>
                          <div>
                            <h3 className={`font-semibold text-sm leading-none ${selectedVideoMode === 'uploadShorts' ? 'text-white' : 'theme-text-secondary'
                              }`}>
                              Upload<br />Short
                            </h3>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Image Post - Mode Selection */}
            {selectedPostType === 'image' && (
              <>
                {/* <label className="block text-sm font-medium theme-text-primary mb-2">
                  Image Post Mode
                </label> */}

                {/* Image Mode Toggle */}


                {/* Upload to Image Interface */}
                {selectedImageMode === 'upload' && (
                  <div>
                    <h4 className="text-sm font-medium theme-text-primary mb-1 flex items-center">
                      
                      Upload Image
                    </h4>

                    {/* Upload Area */}
                    <div className="mb-4 theme-bg-primary ">
                      <div
                        className={` border-2 border-dashed  p-8 text-center transition-all duration-200 cursor-pointer ${dragActive
                            ? "border-blue-400/50 bg-blue-500/10"
                            : "border-white/20 hover:border-white/30"
                          }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                          {formData.media || formData.mediaUrl ? (
                            <div className="space-y-3">
                              <div className="relative">
                                {/* Debug info for upload preview */}
                                {(() => {
                                  const imageSrc = templatedImageUrl ||
                                    formData.mediaUrl ||
                                    (formData.media ? URL.createObjectURL(formData.media) : '');
                                  console.log('🖼️ Upload preview rendering with:', {
                                    templatedImageUrl: templatedImageUrl?.substring(0, 50) + '...',
                                    mediaUrl: formData.mediaUrl?.substring(0, 50) + '...',
                                    hasMedia: !!formData.media,
                                    mediaType: formData.media?.type,
                                    finalSrc: imageSrc.substring(0, 50) + '...'
                                  });
                                  return (
                                    <img
                                      src={imageSrc}
                                      alt="Preview"
                                      className="max-h-32 mx-auto  shadow-sm"
                                      onLoad={() => {
                                        console.log('✅ Upload preview image loaded successfully:', imageSrc.substring(0, 30) + '...');
                                      }}
                                      onError={(e) => {
                                        console.error('❌ Upload preview image failed to load:', imageSrc);
                                        console.error('❌ Error details:', e);
                                      }}
                                    />
                                  );
                                })()}
                                {/* Remove button overlay */}
                                {/* <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      media: undefined,
                                      mediaUrl: undefined,
                                    }));
                                    // Also clear template-related state
                                    setTemplatedImageUrl("");
                                    setSelectedTemplate(undefined);
                                    setImageAnalysis("");
                                  }}
                                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors duration-200"
                                  title="Remove image"
                                >
                                  <X className="w-3 h-3" />
                                </button> */}
                              </div>
                              <div className="flex items-center justify-center flex-col space-y-1">
                                <p className="text-xs theme-text-secondary">
                                  {formData.media?.name || "Uploaded Image"}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      media: undefined,
                                      mediaUrl: undefined,
                                    }));
                                    // Also clear template-related state
                                    setTemplatedImageUrl("");
                                    setSelectedTemplate(undefined);
                                    setImageAnalysis("");
                                  }}
                                  className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center space-x-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                        ) : (
                          <div className="">
                              <Icon name="upload" size={44} />
                            <div>
                              <p className="font-medium theme-text-primary text-sm mb-1">
                                Click to browse image
                              </p>
                              <p className="theme-text-secondary text-xs">

                              </p>
                            </div>
                          </div>
                        )}

                        {/* Upload preloader is now handled by enhanced preloader overlay */}
                      </div>
                    </div>

                  
                  </div>
                )}

                {/* Text to Image Interface */}
                {selectedImageMode === 'textToImage' && (
                  <div>
                    <h4 className="text-sm font-medium theme-text-primary mb-2 flex items-center">
                      <Wand2 className="w-4 h-4 mr-2 text-blue-400" />
                      Generate Image with AI
                    </h4>


                    {/* Image Generation Form */}
                    <div className={`space-y-4 ${generateImageWithPost ? 'hidden' : 'hidden'}`}>
                      {/* Combined Generation Checkbox */}
                      <div className="p-3 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-400/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="generateImageWithPostTextToImage"
                            checked={generateImageWithPost}
                            onChange={(e) => setGenerateImageWithPost(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <div className="flex-1">
                            <label htmlFor="generateImageWithPostTextToImage" className="flex items-center cursor-pointer">
                              <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
                              <span className="text-sm font-medium theme-text-primary">
                                Use main content description as image prompt
                              </span>
                            </label>
                            <p className="text-xs theme-text-secondary mt-1">
                              Instead of using the image description below, use your main post content to generate the image
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Image Description Field - Only show when combined generation is NOT checked */}
                      {!generateImageWithPost && (
                        <div>
                          <label className="block text-sm font-medium theme-text-primary mb-2">
                            Image Description *
                          </label>
                          <textarea
                            value={imageDescription}
                            onChange={(e) => setImageDescription(e.target.value)}
                            className="w-full px-3 py-2 theme-bg-primary/20 border border-grey/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-200 min-h-[80px] text-sm placeholder-gray-400"
                            placeholder="Describe the image you want to generate... (e.g., 'A professional product photo of eco-friendly water bottles')"
                            required
                          />
                        </div>
                      )}

                      {/* Generate Button - Only show when combined generation is NOT checked */}
                      {!generateImageWithPost && (
                        <button
                          type="button"
                          onClick={handleGenerateImage}
                          disabled={isGeneratingImage || !imageDescription.trim()}
                          className="w-full bg-gradient-to-r from-blue-500/80 to-indigo-500/80 text-white py-3 px-4 rounded font-medium hover:from-blue-600/80 hover:to-indigo-600/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              <span>Generating Image...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Generate Image</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Generate Image from Main Content - Only show when combined generation is checked */}
                      {generateImageWithPost && (
                        <div className="space-y-3">
                          <div className="p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-sm font-medium text-green-300">
                                Using your main content description to generate the image
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCombinedGenerationWithPost(formData.prompt)}
                            disabled={isGeneratingBoth || !formData.prompt.trim()}
                            className="w-full bg-gradient-to-r from-green-500/80 to-teal-500/80 text-white py-3 px-4 rounded font-medium hover:from-green-600/80 hover:to-teal-600/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            {isGeneratingBoth ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>Generating Image & Post...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span>Generate Image & Post</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Generated Image Preview */}
                    {(formData.media || formData.mediaUrl) && (
                      <div className="mt-4">
                        <div className="border border-white/20 rounded p-4">
                          <div className="relative">
                            {(() => {
                              const imageSrc = templatedImageUrl ||
                                formData.mediaUrl ||
                                (formData.media ? URL.createObjectURL(formData.media) : '');
                              console.log('🎨 Text-to-image preview rendering with:', {
                                templatedImageUrl: templatedImageUrl?.substring(0, 50) + '...',
                                mediaUrl: formData.mediaUrl?.substring(0, 50) + '...',
                                hasMedia: !!formData.media,
                                mediaType: formData.media?.type,
                                finalSrc: imageSrc.substring(0, 50) + '...'
                              });
                              return (
                                <img
                                  src={imageSrc}
                                  alt="Generated Image"
                                  className="max-h-32 mx-auto shadow-sm rounded"
                                  onLoad={() => {
                                    console.log('✅ Text-to-image preview loaded successfully:', imageSrc.substring(0, 30) + '...');
                                  }}
                                  onError={(e) => {
                                    console.error('❌ Text-to-image preview failed to load:', imageSrc);
                                    console.error('❌ Error details:', e);
                                  }}
                                />
                              );
                            })()}
                            {/* Remove button overlay */}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  media: undefined,
                                  mediaUrl: undefined,
                                }));
                                // Also clear template-related state
                                setTemplatedImageUrl("");
                                setSelectedTemplate(undefined);
                                setImageAnalysis("");
                              }}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors duration-200"
                              title="Remove image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs theme-text-secondary">
                              {formData.media?.name || "AI Generated Image"}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  media: undefined,
                                  mediaUrl: undefined,
                                }));
                                // Also clear template-related state
                                setTemplatedImageUrl("");
                                setSelectedTemplate(undefined);
                                setImageAnalysis("");
                              }}
                              className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center space-x-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Video Post - Upload Interface */}
            {selectedPostType === 'video' && (
              <>
                <label className="block text-sm font-medium theme-text-primary mb-2 flex items-center">
                  Upload Video
                 
                </label>
               <div className="mb-4 theme-bg-primary py-10">
                <div
                  className={` border-2 border-dashed p-0 text-center transition-all duration-200 ${dragActive
                      ? "border-blue-400/50 bg-blue-500/10"
                      : "border-white/20 hover:border-white/30"
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={selectedPostType === 'image' ? 'image/*' : selectedPostType === 'video' ? 'video/*' : 'image/*,video/*'}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  </div>

                  {/* Debug Info - Enhanced debugging */}
                  {/* <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-400/20 rounded text-xs text-yellow-200 space-y-1">
                <div><strong>Debug State:</strong></div>
                <div>• media: {formData.media ? `✅ ${formData.media.type} (${formData.media.name})` : '❌ null'}</div>
                <div>• mediaUrl: {formData.mediaUrl ? `✅ ${formData.mediaUrl.substring(0, 50)}...` : '❌ null'}</div>
                <div>• templatedImageUrl: {templatedImageUrl ? `✅ ${templatedImageUrl.substring(0, 30)}...` : '❌ null'}</div>
                <div>• uploading: {uploading ? '🔄 true' : '✅ false'}</div>
                <div>• Should show preview: {(formData.media || formData.mediaUrl) ? '✅ YES' : '❌ NO'}</div>
              </div> */}

                  {formData.media || formData.mediaUrl ? (
                    <div className="space-y-3">
                      <div className="relative">
                        {/* Check if it's an image */}
                        {(formData.media?.type.startsWith("image/")) ||
                          (formData.mediaUrl && !formData.media && !formData.mediaUrl.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv|m4v)$/i)) ? (
                          <div className="relative">
                            <img
                              src={
                                // Prioritize templated image if available, then uploaded file URL, then local file object
                                templatedImageUrl ||
                                formData.mediaUrl ||
                                (formData.media ? URL.createObjectURL(formData.media) : '')
                              }
                              alt="Preview"
                              className="max-h-40 mx-auto  shadow-sm"
                              onError={(e) => {
                                console.error('Image failed to load:', templatedImageUrl || formData.mediaUrl || formData.media?.name);
                              }}
                            />
                            <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center">
                              <Icon name="image-post" size={12} className="mr-1" />
                              Image
                            </div>
                          </div>
                        ) : (
                          /* Video preview - Show video player with controls */
                          <div className="relative">
                            <video
                              src={
                                formData.mediaUrl
                                  ? formData.mediaUrl : formData.media ? URL.createObjectURL(formData.media) : undefined
                              }
                              className="max-h-40 mx-auto shadow-sm rounded"
                              controls
                              preload="metadata"
                              onError={(e) => {
                                console.error('Video failed to load:', formData.mediaUrl || formData.media?.name);
                              }}
                              onLoadStart={() => {
                                console.log('Video loading started:', formData.mediaUrl || formData.media?.name);
                              }}
                            >
                              Your browser does not support the video tag.
                            </video>
                            {/* <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center">
                              <Icon name="video-post" size={12} className="mr-1" />
                              {videoAspectRatio && is9x16Video(videoAspectRatio) ? 'Vertical Video' : 
                               videoAspectRatio && is16x9Video(videoAspectRatio) ? 'Horizontal Video' : 'Video'}
                            </div> */}
                          </div>
                        )}
                      </div>
                      <div className="text-sm theme-text-secondary space-y-2 text-center">
                        <div>
                          <p className="font-medium theme-text-primary text-sm">
                            {formData.media?.name || "Uploaded Media"}
                          </p>
                          {formData.media && (
                            <p className="text-xs">
                              {(formData.media.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>

                        {/* Compact checkboxes */}
                          {/* <div className="flex gap-2">
                            <div className="flex items-center space-x-1 p-2 theme-bg-primary/20 rounded text-xs">
                              <input
                                type="checkbox"
                                id="useForAI"
                                checked={useForAIReference}
                                onChange={(e) =>
                                  setUseForAIReference(e.target.checked)
                                }
                                className="w-3 h-3 text-blue-600"
                              />
                              <Brain className="w-3 h-3 text-blue-400" />
                              <label
                                htmlFor="useForAI"
                                className="theme-text-secondary cursor-pointer"
                              >
                                AI Reference
                              </label>
                            </div>

                            <div className="flex items-center space-x-1 p-2 theme-bg-primary/20 rounded text-xs">
                              <input
                                type="checkbox"
                                id="useInPost"
                                checked={useInPost}
                                onChange={(e) => setUseInPost(e.target.checked)}
                                className="w-3 h-3 text-green-600"
                              />
                              <Target className="w-3 h-3 text-green-400" />
                              <label
                                htmlFor="useInPost"
                                className="theme-text-secondary cursor-pointer"
                              >
                                Use in Post
                              </label>
                            </div>
                          </div> */}

                        {/* Status indicators */}
                        {analyzingImage && (
                          <div className="flex items-center justify-center p-2 bg-blue-500/10 border border-blue-400/20 rounded text-xs">
                            <Loader className="w-3 h-3 animate-spin mr-2 text-blue-400" />
                            <span className="text-blue-300">AI analyzing...</span>
                          </div>
                        )}
                        {/* Upload preloader is now handled by enhanced preloader overlay */}
                        {videoAspectRatio && (
                          <div className="flex items-center justify-center p-2 bg-green-500/10 border border-green-400/20 rounded text-xs">
                            <CheckCircle className="w-3 h-3 mr-2 text-green-400" />
                            <span className="text-green-300">
                              {is9x16Video(videoAspectRatio) ? '9:16 vertical video ready - stories format (no thumbnail needed)' : 
                               is16x9Video(videoAspectRatio) ? '16:9 horizontal video ready - thumbnail will be generated when you click Generate Post' : 
                               'Video processed and ready - thumbnail will be generated when you click Generate Post'}
                            </span>
                          </div>
                        )}

                        {/* AI Analysis Button */}
                        {(formData.media || formData.mediaUrl) &&
                          ((formData.media?.type.startsWith("image/")) ||
                            (formData.mediaUrl && !formData.media && !formData.mediaUrl.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv|m4v)$/i))) &&
                          !analyzingImage && (<></>
                            // <div className="flex gap-2">
                            //   <button
                            //     type="button"
                            //     onClick={performAIAnalysis}
                            //     disabled={analyzingImage}
                            //     className="flex-1 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 text-white px-3 py-2 rounded text-xs hover:from-blue-600/80 hover:to-indigo-600/80 transition-all duration-200 flex items-center justify-center space-x-1 disabled:opacity-50"
                            //   >
                            //     <Eye className="w-3 h-3" />
                            //     <span>AI Analysis</span>
                            //   </button>
                            //   <button
                            //     type="button"
                            //     onClick={() => {
                            //       const blankTemplate = getTemplateById('blank-template');
                            //       if (blankTemplate) {
                            //         setSelectedTemplate(blankTemplate);
                            //         setShowTemplateEditor(true);
                            //       } else {
                            //         console.error('❌ Blank template not found for Apply Template button');
                            //       }
                            //     }}
                            //     className="flex-1 bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white px-3 py-2 rounded text-xs hover:from-purple-600/80 hover:to-pink-600/80 transition-all duration-200 flex items-center justify-center space-x-1"
                            //   >
                            //     <Palette className="w-3 h-3" />
                            //     <span>Apply Template</span>
                            //   </button>
                            // </div>
                          )}

                        {/* Template Applied UI */}
                        {templatedImageUrl && selectedTemplate && (
                          <div className="bg-purple-500/10 border border-purple-400/20  p-2">
                            <div className="flex justify-between mb-2">
                              <h4 className="font-medium text-purple-300 flex  text-xs">
                                <Palette className="w-3 h-3 mr-1" />
                                Image Updated: {selectedTemplate.name}
                              </h4>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleEditTemplate}
                                className="flex-1 bg-purple-500/80 text-white px-3 py-1.5 rounded text-xs hover:bg-purple-600/80 transition-colors flex items-center justify-center space-x-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleDeleteTemplate}
                                className="flex-1 bg-red-500/80 text-white px-3 py-1.5 rounded text-xs hover:bg-red-600/80 transition-colors flex items-center justify-center space-x-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            media: undefined,
                            mediaUrl: undefined,
                          }));
                          // Also clear template-related state
                          setTemplatedImageUrl("");
                          setSelectedTemplate(undefined);
                          setImageAnalysis("");
                        }}
                        className="text-red-400 hover:text-red-300 text-xs font-medium text-center w-full flex items-center justify-center space-x-1  "
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                     
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-transparent"
                        >
                          <div className="">
                              <Icon name="upload" size={44} />
                            <div>
                              <p className="font-medium theme-text-primary text-sm mb-1">
                                Click to browse video
                              </p>
                              <p className="theme-text-secondary text-xs">

                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                     
                    </div>
                  )}
                </div>

                {/* Image Analysis Results */}
                {imageAnalysis && (
                  <div className="bg-blue-500/10 border border-blue-400/20  p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-300 flex items-center text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        AI Analysis Complete
                      </h4>
                      <div className="max-h-24 overflow-y-auto">
                        <p className="text-blue-200 text-xs leading-relaxed">
                          {imageAnalysis}
                        </p>
                      </div>
                      <button
                        onClick={useImageAnalysis}
                        className="bg-gradient-to-r from-blue-500/80 to-indigo-500/80 text-white px-3 py-1.5 rounded text-xs hover:from-blue-600/80 hover:to-indigo-600/80 transition-all duration-200 flex items-center space-x-1"
                      >
                        <span>Add to Description</span>
                        <Sparkles className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column - Content Details */}
          <div className="space-y-4">
            <div className="flex-1">
              <label className="block text-sm font-medium theme-text-primary mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Content Description *
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, prompt: e.target.value }))
                }
                className="w-full px-3 py-2 theme-bg-primary/20 border border-grey/10  focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-200 min-h-[160px] text-sm  placeholder-gray-400"
                placeholder="Describe what you want to share... (e.g., 'Launch of our new eco-friendly water bottles')"
                required
              />
              <p className="text-xs theme-text-secondary mt-1">
                Be specific about your message and call-to-action
              </p>
            </div>

            {/* Aspect Ratio Selection - Only show for text-to-image mode */}
            {selectedPostType === 'image' && selectedImageMode === 'textToImage' && (
              <div className="mb-4">
                <label className="block text-md font-medium theme-text-primary mb-2">
                  Image Dimensions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '1:1', value: '1:1', icon: '⬜' },
                    { label: '16:9', value: '16:9', icon: '▬' },
                    { label: '9:16', value: '9:16', icon: '▫' }
                  ].map((ratio) => (
                    <button
                      key={ratio.value}
                      type="button"
                      onClick={() => handleAspectRatioChange(ratio.value)}
                      className={`p-3 border transition-all duration-200 flex flex-col items-center justify-center ${
                        aspectRatio === ratio.value
                          ? 'theme-bg-quaternary shadow-lg theme-text-secondary'
                          : 'theme-bg-primary hover:theme-bg-primary/50'
                      }`}
                    >
                             <div className={`border mx-aut  mb-2 ${ratio.value === "1:1"
                                ? 'w-8 h-8 border-1 theme-border-secondary'
                                : ratio.value === "16:9"
                                  ? 'w-10 h-6 border-1'
                                  : ratio.value === "9:16"
                                    ? 'w-6 h-10 border-1'
                                    : 'w-8 h-8 border-1'
                              } ${aspectRatio === ratio.value
                                ? 'theme-border-secondary border-2'
                                :'theme-border-dark border-1'
                               
                              }`}>
                          </div>
                      <div className="text-md font-medium whitespace-pre-line">
                        {ratio.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
          <div className="hidden">
            <label className="block text-sm font-medium theme-text-primary mb-2">
              Target Platforms
            </label>
            <div className="grid lg:grid-cols-1 gap-2 grid-cols-2">
              {platformOptions.map((platform) => {
                const IconComponent = platform.icon;
                const isSelected = formData.selectedPlatforms?.includes(
                  platform.id,
                );
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={`p-2  border transition-all duration-200 flex items-center space-x-2 text-sm ${isSelected
                        ? `bg-[#fff] ${platform.borderColor}/50 border`
                        : "border-white/10 hover:border-white/20 theme-bg-primary/10"
                      }`}
                  >
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center text-white ${getPlatformColors(platform.id)}`}
                    >
                      <IconComponent className="w-3 h-3" />
                    </div>
                    <span
                      className={`font-medium ${isSelected ? platform.color : "theme-text-secondary"}`}
                    >
                      {platform.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onBack}
            className="hidden flex-1 theme-bg-primary theme-text-secondary py-3 px-6  font-medium hover:theme-bg-primary/30 transition-colors duration-200 text-sm"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={
              !formData.prompt.trim() || !formData.selectedPlatforms?.length || isGeneratingBoth
            }
            className="rounded-full flex-1 flex items-center justify-between theme-bg-trinary theme-text-light py-2 px-4 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
          >
            {isGeneratingBoth ? (
              <div className="flex items-center">
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                GENERATING POST & IMAGE...
              </div>
            ) : isGeneratingThumbnail ? (
              <div className="flex items-center">
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                GENERATING THUMBNAIL...
              </div>
            ) : (
              <div className="flex items-center">
                <Wand2 className="w-6 h-6 mr-1" /> 
                GENERATE POST
              </div>
            )}
            <div className=" sm:inline-block rounded-full theme-bg-quaternary theme-text-secondary px-2 py-1">
              <Icon name="wallet" size={14} className="inline mr-1 mt-[-1px]" />
              500
            </div>
          </button>
        </div>
          </form>
        </>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onCancel={handleTemplateSelectorCancel}
        />
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && selectedTemplate && (formData.media || formData.mediaUrl || videoThumbnailUrl) && (
        <ImageTemplateEditor
          imageUrl={
            templatedImageUrl || 
            videoThumbnailUrl || 
            (formData.media ? URL.createObjectURL(formData.media) : formData.mediaUrl!)
          }
          selectedTemplate={selectedTemplate}
          onSave={handleTemplateEditorSave}
          onCancel={handleTemplateEditorCancel}
          isVideoThumbnail={selectedPostType === 'video'}
        />
      )}

      {/* Post Preview */}
      {showPreview && generatedResults && generatedResults.length > 0 && (
        <div className="mt-6">
          <PostPreview
            posts={generatedResults}
            onBack={() => setShowPreview(false)}
            onEdit={() => { }}
          />
        </div>
      )}
    </div>
  );
};
