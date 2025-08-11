import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Tag, Camera, Wand2, Eye, Loader, Sparkles } from 'lucide-react';
import { PostContent, Platform } from '../types';
import { uploadMedia, getCurrentUser } from '../lib/database';
import { analyzeImage as analyzeImageWithGemini } from '../lib/gemini'; // Renamed to avoid conflict
import { AIImageGenerator } from './AIImageGenerator';

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result.split(',')[1]); // Get base64 part
      } else {
        reject(new Error('FileReader result is not a string'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

interface ContentInputProps {
  onNext: (data: PostContent) => void;
  onBack: () => void;
  initialData?: Partial<PostContent>;
  selectedPlatforms: Platform[];
  editMode?: boolean;
}

export const ContentInput: React.FC<ContentInputProps> = ({
  onNext,
  onBack,
  initialData,
  selectedPlatforms,
  editMode
}) => {
  const [formData, setFormData] = useState<PostContent>({
    prompt: initialData?.prompt || '',
    tags: initialData?.tags || [],
    campaignId: initialData?.campaignId || '',
    selectedPlatforms: initialData?.selectedPlatforms || selectedPlatforms,
    media: initialData?.media || undefined,
    mediaUrl: initialData?.mediaUrl || undefined,
  });
  const [dragActive, setDragActive] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState('');
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [useForAIReference, setUseForAIReference] = useState(true);
  const [useInPost, setUseInPost] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with existing data when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        prompt: initialData.prompt || '',
        tags: initialData.tags || [],
        campaignId: initialData.campaignId || '',
        selectedPlatforms: initialData.selectedPlatforms || selectedPlatforms,
        media: initialData.media,
        mediaUrl: initialData.mediaUrl,
      }));
      if (initialData.imageAnalysis) {
        setImageAnalysis(initialData.imageAnalysis);
      }
    }
  }, [initialData, selectedPlatforms]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const mediaUrl = await uploadMedia(file, user.id);
      setFormData(prev => ({ ...prev, media: file, mediaUrl }));
    } catch (error) {
      console.error('Error uploading file:', error);
      // Still set the file for preview, but without URL
      setFormData(prev => ({ ...prev, media: file }));
    } finally {
      setUploading(false);
    }
  };

  const analyzeImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    setAnalyzingImage(true);
    try {
      const base64 = await fileToBase64(file);

      console.log('Analyzing image with Gemini API...');

      // Call the Gemini analysis API with proper data URL format
      const dataUrl = `data:${file.type};base64,${base64}`;

      const response = await fetch(`/api/ai/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: dataUrl,
          mimeType: file.type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Analysis API error:', errorData);
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const result = await response.json();
      console.log('Analysis result:', result);

      if (result.success && result.analysis) {
        setImageAnalysis(result.analysis);
        console.log('Image analysis completed successfully');
      } else {
        console.log('No analysis in result:', result);
        setImageAnalysis('Image uploaded successfully. Add a description for better content generation.');
      }
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      setImageAnalysis(`Image uploaded successfully. ${error.message?.includes('quota') ? 'AI analysis quota exceeded.' : 'Add a description for better content generation.'}`);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.prompt.trim()) {
      onNext(formData);
    }
  };

  const platformOptions = [
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-600', icon: '📘' },
    { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: '📷' },
    { id: 'twitter', name: 'Twitter/X', color: 'bg-black', icon: '🐦' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700', icon: '💼' },
    { id: 'tiktok', name: 'TikTok', color: 'bg-black', icon: '🎵' },
    { id: 'youtube', name: 'YouTube', color: 'bg-red-600', icon: '🎬' },
  ];

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms?.includes(platform as Platform)
        ? prev.selectedPlatforms.filter(p => p !== platform)
        : [...(prev.selectedPlatforms || []), platform as Platform]
    }));
  };

  const useImageAnalysis = () => {
    setFormData(prev => ({
      ...prev,
      prompt: prev.prompt + (prev.prompt ? '\n\n' : '') + `Image Analysis: ${imageAnalysis}`
    }));
    setImageAnalysis('');
  };

  const performAIAnalysis = async () => {
    if (formData.media && formData.media.type.startsWith('image/')) {
      await analyzeImage(formData.media);
    }
  };

  const handleAIImageGenerated = async (imageUrl: string) => {
    try {
      // Convert the AI generated image URL to a File object
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'ai-generated-image.png', { type: 'image/png' });

      // Upload the AI generated image to our storage
      const user = await getCurrentUser();
      if (user) {
        const mediaUrl = await uploadMedia(file, user.id);
        setFormData(prev => ({ ...prev, media: file, mediaUrl }));
      } else {
        // If no user, just use the direct URL
        setFormData(prev => ({ ...prev, mediaUrl: imageUrl }));
      }
    } catch (error) {
      console.error('Error handling AI generated image:', error);
      // Fallback: just use the URL directly
      setFormData(prev => ({ ...prev, mediaUrl: imageUrl }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wand2 className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Content</h2>
        <p className="text-gray-600">Add your media and describe what you want to share</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <Camera className="w-4 h-4 inline mr-2" />
              Upload Media (Optional)
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
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
                <div className="space-y-4">
                  {(formData.media?.type.startsWith('image/') || formData.mediaUrl?.startsWith('image/')) ? (
                    <img
                      src={formData.media ? URL.createObjectURL(formData.media) : formData.mediaUrl!}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg shadow-md"
                    />
                  ) : (
                    <video
                      src={formData.media ? URL.createObjectURL(formData.media) : formData.mediaUrl!}
                      className="max-h-48 mx-auto rounded-lg shadow-md"
                      controls
                    />
                  )}
                  <div className="text-sm text-gray-600 space-y-3">
                    <div>
                      <p className="font-medium">{formData.media?.name || 'Uploaded Media'}</p>
                      {formData.media && (
                        <p>{(formData.media.size / 1024 / 1024).toFixed(2)} MB</p>
                      )}
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          id="useForAI"
                          checked={useForAIReference}
                          onChange={(e) => setUseForAIReference(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="useForAI" className="text-sm text-gray-700 cursor-pointer">
                          Use for AI reference
                        </label>
                      </div>

                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          id="useInPost"
                          checked={useInPost}
                          onChange={(e) => setUseInPost(e.target.checked)}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <label htmlFor="useInPost" className="text-sm text-gray-700 cursor-pointer">
                          Use it in the post
                        </label>
                      </div>
                    </div>

                    {analyzingImage && (
                      <div className="flex items-center justify-center mt-3 p-2 bg-blue-50 rounded-lg">
                        <Loader className="w-4 h-4 animate-spin mr-2 text-blue-600" />
                        <span className="text-blue-700 font-medium">🤖 AI is analyzing your image...</span>
                      </div>
                    )}
                    {uploading && (
                      <div className="flex items-center justify-center mt-2 p-2 bg-gray-50 rounded-lg">
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-gray-700">Uploading file...</span>
                      </div>
                    )}
                    {!analyzingImage && !uploading && (formData.media || formData.mediaUrl) && !imageAnalysis && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-700 text-xs flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          Media uploaded successfully! AI analysis will appear above.
                        </p>
                      </div>
                    )}

                    {/* AI Analysis Button */}
                    {(formData.media || formData.mediaUrl) && formData.media?.type.startsWith('image/') && !analyzingImage && (
                      <button
                        type="button"
                        onClick={performAIAnalysis}
                        disabled={analyzingImage}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <Eye className="w-4 h-4" />
                        <span>AI Analysis</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, media: undefined, mediaUrl: undefined }))}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">Drop your files here</p>
                    <p className="text-gray-500 mt-1">or click to browse</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose Files</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAIGenerator(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate with AI</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Upload files up to 50MB or generate images with AI</p>
                </div>
              )}
            </div>
          </div>

          {/* Image Analysis Results - Show prominently when available */}
          {imageAnalysis && (
            <div className="lg:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center text-lg">
                    <Eye className="w-5 h-5 mr-2" />
                    🤖 AI Image Analysis Complete
                  </h4>
                  <p className="text-blue-800 text-sm leading-relaxed mb-4">{imageAnalysis}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Sparkles className="w-4 h-4 mr-1" />
                    <span>Click "Add to Description" to use this analysis in your content</span>
                  </div>
                </div>
                <button
                  onClick={useImageAnalysis}
                  className="ml-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                >
                  <span>Add to Description</span>
                  <span className="text-lg">✨</span>
                </button>
              </div>
            </div>
          )}

          {/* Content Details */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Content Description *
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                rows={6}
                placeholder="Describe what you want to share... (e.g., 'Launch of our new eco-friendly water bottles with 50% recycled materials')"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Be specific about your message, key points, and call-to-action
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign ID (Optional)
              </label>
              <input
                type="text"
                value={formData.campaignId}
                onChange={(e) => setFormData(prev => ({ ...prev, campaignId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., spring-launch-2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Tags & Keywords
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Add keywords..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Target Platforms for This Post
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {platformOptions.map(platform => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-2 ${
                      formData.selectedPlatforms?.includes(platform.id as Platform)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">{platform.icon}</span>
                    <span className="text-sm font-medium">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-100 text-gray-700 py-4 px-8 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!formData.prompt.trim() || !formData.selectedPlatforms?.length}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
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
    </div>
  );
};