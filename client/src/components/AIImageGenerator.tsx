import React, { useState } from 'react';
import { Wand2, Loader, Download, Sparkles, Eye, RefreshCw } from 'lucide-react';
import { generateImage, generateImageVariations, getPlatformImageSuggestions, type ImageGenerationRequest, type GeneratedImage } from '../lib/imageGeneration';
import { Platform } from '../types';

interface AIImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
  contentText?: string;
  selectedPlatforms?: Platform[];
  companyInfo?: any;
  onClose: () => void;
}

export const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({
  onImageGenerated,
  contentText = '',
  selectedPlatforms = [],
  companyInfo,
  onClose
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [imageRequest, setImageRequest] = useState<ImageGenerationRequest>({
    prompt: '',
    style: 'professional',
    aspectRatio: '1:1',
    quality: 'standard'
  });
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleGenerateImage = async () => {
    if (!imageRequest.prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const image = await generateImage(imageRequest);
      setGeneratedImages([image, ...generatedImages]);
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVariations = async (baseImage: GeneratedImage) => {
    setIsGenerating(true);
    try {
      const variations = await generateImageVariations({
        prompt: baseImage.prompt,
        style: imageRequest.style,
        aspectRatio: imageRequest.aspectRatio,
        quality: imageRequest.quality
      }, 3);
      setGeneratedImages([...variations, ...generatedImages]);
    } catch (error) {
      console.error('Failed to generate variations:', error);
      alert('Failed to generate variations. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (!contentText.trim()) return;
    
    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai/suggest-image-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentText,
          platforms: selectedPlatforms,
          industry: companyInfo?.industry || '',
          brandTone: companyInfo?.brandTone || 'professional'
        })
      });
      
      const data = await response.json();
      if (data.prompts) {
        setSuggestedPrompts(data.prompts);
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleUseSuggestion = (prompt: string) => {
    setImageRequest(prev => ({ ...prev, prompt }));
  };

  const handleUseImage = (imageUrl: string) => {
    onImageGenerated(imageUrl);
    onClose();
  };

  const platformOptimizedSettings = getPlatformImageSuggestions(selectedPlatforms);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI Image Generator</h2>
                <p className="text-gray-600">Create stunning visuals for your social media posts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Generation Panel */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Image Description
                </label>
                <textarea
                  value={imageRequest.prompt}
                  onChange={(e) => setImageRequest(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Describe the image you want to generate..."
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-24"
                />
              </div>

              {/* Suggested Prompts */}
              {contentText && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      AI Suggestions Based on Your Content
                    </label>
                    <button
                      onClick={handleGetSuggestions}
                      disabled={loadingSuggestions}
                      className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700"
                    >
                      {loadingSuggestions ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>{loadingSuggestions ? 'Getting suggestions...' : 'Get AI Suggestions'}</span>
                    </button>
                  </div>
                  
                  {suggestedPrompts.length > 0 && (
                    <div className="space-y-2">
                      {suggestedPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => handleUseSuggestion(prompt)}
                          className="w-full p-3 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <div className="flex items-start space-x-2">
                            <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-800">{prompt}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Style Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                  <select
                    value={imageRequest.style}
                    onChange={(e) => setImageRequest(prev => ({ ...prev, style: e.target.value as any }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="professional">Professional</option>
                    <option value="realistic">Realistic</option>
                    <option value="artistic">Artistic</option>
                    <option value="cartoon">Cartoon</option>
                    <option value="minimalist">Minimalist</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                  <select
                    value={imageRequest.aspectRatio}
                    onChange={(e) => setImageRequest(prev => ({ ...prev, aspectRatio: e.target.value as any }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="1:1">Square (1:1) - Instagram, Facebook</option>
                    <option value="16:9">Landscape (16:9) - LinkedIn, Twitter</option>
                    <option value="9:16">Portrait (9:16) - TikTok, Stories</option>
                    <option value="4:3">Standard (4:3) - General</option>
                  </select>
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                <div className="flex space-x-4">
                  {['standard', 'hd'].map((quality) => (
                    <label key={quality} className="flex items-center">
                      <input
                        type="radio"
                        name="quality"
                        value={quality}
                        checked={imageRequest.quality === quality}
                        onChange={(e) => setImageRequest(prev => ({ ...prev, quality: e.target.value as any }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{quality}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateImage}
                disabled={isGenerating || !imageRequest.prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Generate Image</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Images Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Generated Images</h3>
              
              {generatedImages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Wand2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No images generated yet</p>
                  <p className="text-sm">Start by describing your desired image</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedImages.map((image, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{image.prompt}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleUseImage(image.url)}
                          className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Use This</span>
                        </button>
                        
                        <button
                          onClick={() => handleGenerateVariations(image)}
                          disabled={isGenerating}
                          className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Variations</span>
                        </button>
                        
                        <a
                          href={image.url}
                          download="ai-generated-image.png"
                          className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center justify-center"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
