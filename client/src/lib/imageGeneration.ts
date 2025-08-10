import axios from 'axios';

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'realistic' | 'artistic' | 'cartoon' | 'professional' | 'minimalist';
  aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16';
  quality?: 'standard' | 'hd';
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  created_at: string;
}

// Using OpenAI DALL-E 3 API
export async function generateImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
  try {
    // Enhanced prompt based on style and platform requirements
    let enhancedPrompt = request.prompt;
    
    // Add style modifiers
    switch (request.style) {
      case 'professional':
        enhancedPrompt += ', professional business style, clean, corporate, high-quality';
        break;
      case 'artistic':
        enhancedPrompt += ', artistic style, creative, visually appealing, aesthetic';
        break;
      case 'cartoon':
        enhancedPrompt += ', cartoon style, colorful, friendly, engaging';
        break;
      case 'minimalist':
        enhancedPrompt += ', minimalist design, clean, simple, modern';
        break;
      default:
        enhancedPrompt += ', photorealistic, high quality, professional lighting';
    }

    // Add aspect ratio guidance
    switch (request.aspectRatio) {
      case '16:9':
        enhancedPrompt += ', landscape orientation, wide format';
        break;
      case '4:3':
        enhancedPrompt += ', standard format';
        break;
      case '9:16':
        enhancedPrompt += ', portrait orientation, vertical format, mobile-friendly';
        break;
      default:
        enhancedPrompt += ', square format, social media optimized';
    }

    const response = await axios.post('/api/ai/generate-image', {
      prompt: enhancedPrompt,
      size: request.aspectRatio === '1:1' ? '1024x1024' : 
            request.aspectRatio === '16:9' ? '1792x1024' :
            request.aspectRatio === '9:16' ? '1024x1792' : '1024x1024',
      quality: request.quality || 'standard',
      style: request.style || 'realistic'
    });

    return {
      url: response.data.imageUrl,
      prompt: request.prompt,
      style: request.style || 'realistic',
      aspectRatio: request.aspectRatio || '1:1',
      created_at: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('Error generating image:', error);
    throw new Error(error.response?.data?.error || 'Failed to generate image');
  }
}

// Generate multiple variations of an image
export async function generateImageVariations(
  request: ImageGenerationRequest, 
  count: number = 3
): Promise<GeneratedImage[]> {
  const variations = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const variation = await generateImage({
        ...request,
        prompt: `${request.prompt}, variation ${i + 1}`
      });
      variations.push(variation);
    } catch (error) {
      console.error(`Failed to generate variation ${i + 1}:`, error);
    }
  }
  
  return variations;
}

// Get platform-optimized image suggestions
export function getPlatformImageSuggestions(platforms: string[]): ImageGenerationRequest[] {
  const suggestions: ImageGenerationRequest[] = [];
  
  platforms.forEach(platform => {
    switch (platform) {
      case 'instagram':
        suggestions.push({
          prompt: 'Instagram-optimized image',
          style: 'artistic',
          aspectRatio: '1:1',
          quality: 'hd'
        });
        break;
      case 'linkedin':
        suggestions.push({
          prompt: 'Professional LinkedIn post image',
          style: 'professional',
          aspectRatio: '16:9',
          quality: 'hd'
        });
        break;
      case 'twitter':
        suggestions.push({
          prompt: 'Twitter/X engaging post image',
          style: 'realistic',
          aspectRatio: '16:9',
          quality: 'standard'
        });
        break;
      case 'facebook':
        suggestions.push({
          prompt: 'Facebook post image',
          style: 'realistic',
          aspectRatio: '1:1',
          quality: 'standard'
        });
        break;
      case 'tiktok':
        suggestions.push({
          prompt: 'TikTok vertical image',
          style: 'artistic',
          aspectRatio: '9:16',
          quality: 'hd'
        });
        break;
    }
  });
  
  return suggestions;
}

// Analyze image content and suggest improvements
export async function analyzeGeneratedImage(imageUrl: string): Promise<string> {
  try {
    const response = await axios.post('/api/ai/analyze-image', {
      imageUrl
    });
    return response.data.analysis;
  } catch (error) {
    console.error('Error analyzing image:', error);
    return 'Unable to analyze image';
  }
}
