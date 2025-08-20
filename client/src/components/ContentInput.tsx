import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Tag,
  Camera,
  Wand2,
  Eye,
  Loader,
  Sparkles,
  Image as ImageIcon,
  Video,
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
} from "lucide-react";
import { PostContent, Platform } from "../types";
import { uploadMedia, getCurrentUser } from "../lib/database";
import { analyzeImage as analyzeImageWithGemini } from "../lib/gemini"; // Renamed to avoid conflict
import { AIImageGenerator } from "./AIImageGenerator";
import { PostPreview } from "./PostPreview";
import { getPlatformColors, platformOptions } from "../utils/platformIcons";

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
  const [formData, setFormData] = useState<PostContent>({
    prompt: initialData?.prompt || "",
    tags: initialData?.tags || [],
    campaignId: initialData?.campaignId || "",
    selectedPlatforms: initialData?.selectedPlatforms ||
      selectedPlatforms || ["linkedin"],
    media: initialData?.media || undefined,
    mediaUrl: initialData?.mediaUrl || undefined,
  });
  const [dragActive, setDragActive] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState("");
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [useForAIReference, setUseForAIReference] = useState(true);
  const [useInPost, setUseInPost] = useState(true);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with existing data when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        prompt: initialData.prompt || "",
        tags: initialData.tags || [],
        campaignId: initialData.campaignId || "",
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
    setUploading(true);
    try {
      const userResult = await getCurrentUser();
      if (!userResult || !userResult.user) {
        throw new Error("User not authenticated");
      }

      const mediaUrl = await uploadMedia(file, userResult.user.id);
      setFormData((prev) => ({ ...prev, media: file, mediaUrl }));
    } catch (error) {
      console.error("Error uploading file:", error);
      // Still set the file for preview, but without URL
      setFormData((prev) => ({ ...prev, media: file }));
    } finally {
      setUploading(false);
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
          : "http://localhost:5000");
      const response = await fetch(`${apiUrl}/api/ai/analyze-image`, {
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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.prompt.trim()) {
      // For now, passing an empty object for companyInfo and mediaAssets to simulate the structure
      // This should be replaced with actual data fetching or state management
      const companyInfo = {
        name: "Sample Company",
        industry: "Technology",
        brand_tone: "professional",
        target_audience: "Professionals",
        description: "A sample company for content generation",
      };
      const mediaAssets = formData.mediaUrl
        ? [{ url: formData.mediaUrl, type: formData.media?.type || "image" }]
        : [];

      const postData = {
        ...formData,
        prompt: formData.prompt,
        selectedPlatforms: formData.selectedPlatforms,
        platforms: formData.selectedPlatforms,
        companyName: companyInfo.name,
        companyInfo,
        mediaAssets,
        analysisResults: imageAnalysis,
        industry: companyInfo.industry,
        tone: companyInfo.brand_tone,
        targetAudience: companyInfo.target_audience,
        description: companyInfo.description,
        imageAnalysis: imageAnalysis,
      };

      // If onNext callback is provided, use it
      if (onNext && typeof onNext === "function") {
        onNext(postData);
      } else {
        // Otherwise, simulate generation for preview
        const simulatedGeneratedPosts = [
          {
            platform: formData.selectedPlatforms[0] || "linkedin",
            content: formData.prompt,
            caption: formData.prompt,
            hashtags: formData.tags,
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
      await analyzeImage(formData.media);
    }
  };

  const handleAIImageGenerated = async (imageUrl: string) => {
    try {
      // Convert the AI generated image URL to a File object
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "ai-generated-image.png", {
        type: "image/png",
      });

      // Upload the AI generated image to our storage
      const user = await getCurrentUser();
      if (user) {
        const mediaUrl = await uploadMedia(file, user.id);
        setFormData((prev) => ({ ...prev, media: file, mediaUrl }));
      } else {
        // If no user, just use the direct URL
        setFormData((prev) => ({ ...prev, mediaUrl: imageUrl }));
      }
    } catch (error) {
      console.error("Error handling AI generated image:", error);
      // Fallback: just use the URL directly

      setFormData((prev) => ({ ...prev, mediaUrl: imageUrl }));
    }
  };

  const handleNext = () => {
    if (generatedResults && generatedResults.length > 0) {
      setShowPreview(true);
    }
  };

  return (
    <div className="w-full mx-auto theme-bg-card backdrop-blur-sm rounded-xl border border-white/10 p-6 m0">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mx-auto ">
          <Wand2 className="w-6 h-6 text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold theme-text-primary mb-1">
          Create Your Content
        </h2>
        <p className="text-sm theme-text-secondary">
          Add your media and describe what you want to share
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Media Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium theme-text-primary mb-3 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2 text-blue-400" />
                Upload Media
                <span className="ml-2 text-xs theme-text-secondary">
                  (Optional)
                </span>
              </label>
            </div>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                dragActive
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
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {formData.media || formData.mediaUrl ? (
                <div className="space-y-3">
                  <div className="relative">
                    {formData.media?.type.startsWith("image/") ||
                    formData.mediaUrl?.startsWith("image/") ? (
                      <div className="relative">
                        <img
                          src={
                            formData.media
                              ? URL.createObjectURL(formData.media)
                              : formData.mediaUrl!
                          }
                          alt="Preview"
                          className="max-h-40 mx-auto rounded-lg shadow-sm"
                        />
                        <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center">
                          <ImageIcon className="w-3 h-3 mr-1" />
                          Image
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <video
                          src={
                            formData.media
                              ? URL.createObjectURL(formData.media)
                              : formData.mediaUrl!
                          }
                          className="max-h-40 mx-auto rounded-lg shadow-sm"
                          controls
                        />
                        <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center">
                          <Video className="w-3 h-3 mr-1" />
                          Video
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm theme-text-secondary space-y-2">
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
                    <div className="flex gap-2">
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
                    </div>

                    {/* Status indicators */}
                    {analyzingImage && (
                      <div className="flex items-center justify-center p-2 bg-blue-500/10 border border-blue-400/20 rounded text-xs">
                        <Loader className="w-3 h-3 animate-spin mr-2 text-blue-400" />
                        <span className="text-blue-300">AI analyzing...</span>
                      </div>
                    )}
                    {uploading && (
                      <div className="flex items-center justify-center p-2 bg-amber-500/10 border border-amber-400/20 rounded text-xs">
                        <Loader className="w-3 h-3 animate-spin mr-2 text-amber-400" />
                        <span className="text-amber-300">Uploading...</span>
                      </div>
                    )}

                    {/* AI Analysis Button */}
                    {(formData.media || formData.mediaUrl) &&
                      formData.media?.type.startsWith("image/") &&
                      !analyzingImage && (
                        <button
                          type="button"
                          onClick={performAIAnalysis}
                          disabled={analyzingImage}
                          className="w-full bg-gradient-to-r from-blue-500/80 to-indigo-500/80 text-white px-3 py-2 rounded text-xs hover:from-blue-600/80 hover:to-indigo-600/80 transition-all duration-200 flex items-center justify-center space-x-1 disabled:opacity-50"
                        >
                          <Eye className="w-3 h-3" />
                          <span>AI Analysis</span>
                        </button>
                      )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        media: undefined,
                        mediaUrl: undefined,
                      }))
                    }
                    className="text-red-400 hover:text-red-300 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-8 h-8 theme-text-secondary mx-auto" />
                  <div>
                    <p className="font-medium theme-text-primary text-sm">
                      Drop files here
                    </p>
                    <p className="theme-text-secondary text-xs mt-1">
                      or click to browse
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-500/80 text-white px-4 py-2 rounded text-xs hover:bg-blue-600/80 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Choose Files</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAIGenerator(true)}
                      className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white px-4 py-2 rounded text-xs hover:from-purple-600/80 hover:to-pink-600/80 transition-all duration-200 flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate AI</span>
                    </button>
                  </div>
                  <p className="text-xs theme-text-secondary">
                    Images, videos up to 50MB
                  </p>
                </div>
              )}
            </div>

            {/* Image Analysis Results */}
            {imageAnalysis && (
              <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-3">
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
                className="w-full px-3 py-2 theme-bg-primary/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-200 min-h-[160px] text-sm  placeholder-gray-400"
                placeholder="Describe what you want to share... (e.g., 'Launch of our new eco-friendly water bottles')"
                required
              />
              <p className="text-xs theme-text-secondary mt-1">
                Be specific about your message and call-to-action
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">
                Campaign ID
              </label>
              <input
                type="text"
                value={formData.campaignId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    campaignId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 theme-bg-primary/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-200 text-sm placeholder-gray-400"
                placeholder="e.g., spring-launch-2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Tags & Keywords
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  className="flex-1 px-3 py-2 theme-bg-primary/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-200 text-sm  placeholder-gray-400"
                  placeholder="Add keywords..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="theme-bg-primary/40 theme-text-primary px-3 py-2 rounded-lg hover:theme-bg-primary/60 transition-colors duration-200 text-sm"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-400 hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium theme-text-primary mb-3">
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
                    className={`p-2 rounded-lg border transition-all duration-200 flex items-center space-x-2 text-sm ${
                      isSelected
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
            className="flex-1 theme-bg-primary/20 theme-text-secondary py-3 px-6 rounded-lg font-medium hover:theme-bg-primary/30 transition-colors duration-200 text-sm"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={
              !formData.prompt.trim() || !formData.selectedPlatforms?.length
            }
            className="flex-1 bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600/80 hover:to-pink-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
          >
            Generate Posts with AI
          </button>
        </div>
      </form>

      {/* AI Image Generator Modal */}
      {showAIGenerator && (
        <AIImageGenerator
          onImageGenerated={handleAIImageGenerated}
          contentText={formData.prompt}
          selectedPlatforms={formData.selectedPlatforms}
          onClose={() => setShowAIGenerator(false)}
        />
      )}

      {/* Post Preview */}
      {showPreview && generatedResults && generatedResults.length > 0 && (
        <div className="mt-6">
          <PostPreview
            generatedPosts={generatedResults}
            onBack={() => setShowPreview(false)}
            onNext={() => {
              console.log("Moving to next step with posts:", generatedResults);
            }}
            mediaUrl={formData.mediaUrl}
          />
        </div>
      )}
    </div>
  );
};
