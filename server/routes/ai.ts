import express, { Request, Response } from 'express'
import { GoogleGenAI } from '@google/genai'
import axios from 'axios'
import multer from 'multer'
import dotenv from 'dotenv'

dotenv.config()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router()

// Initialize AI Services
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || null
let genAI: GoogleGenAI | null = null
if (process.env.VITE_GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY })
  } catch (error) {
    console.warn('Failed to initialize GoogleGenAI client:', error)
  }
}
// AI Model Configuration
interface AIModel {
  id: string;
  provider: 'openai' | 'google' | 'anthropic';
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
}

const AI_MODELS: { [key: string]: AIModel } = {
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    maxTokens: 4096
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    provider: 'openai',
    maxTokens: 4096
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    provider: 'openai',
    maxTokens: 4096
  },
  'gemini-pro': {
    id: 'gemini-pro',
    provider: 'google',
    maxTokens: 8192
  },
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    provider: 'google',
    maxTokens: 8192
  },
  'claude-3-opus': {
    id: 'claude-3-opus-20240229',
    provider: 'anthropic',
    maxTokens: 4096
  },
  'claude-3-sonnet': {
    id: 'claude-3-sonnet-20240229',
    provider: 'anthropic',
    maxTokens: 4096
  }
};

// POST /api/ai/analyze-image - Analyze image content with Gemini
router.post('/analyze-image', async (req: Request, res: Response) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      });
    }

    if (!process.env.VITE_GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured'
      });
    }
    console.log('Gemini API key is configured, proceeding with image analysis...', process.env.VITE_GEMINI_API_KEY , 'Yes' );


    // Use GoogleGenAI for image analysis (Gemini vision)
    const promptText = `Analyze this image and provide a detailed description that would be useful for social media content creation. Include:
1. What's in the image (objects, people, setting)
2. The mood/atmosphere
3. Colors and visual elements
4. Potential marketing angles or messages
5. Suggested content themes

Keep the description concise but informative for social media marketing purposes.`;

    // Clean the base64 data if it has data URL prefix
    let cleanBase64 = image;
    if (image.startsWith('data:')) {
      cleanBase64 = image.split(',')[1];
    }

    const prompt = [
      { text: promptText },
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg'
        }
      }
    ];

    if (!genAI) {
      return res.status(500).json({ success: false, error: 'GoogleGenAI client not initialized' });
    }
    console.log('Analyzing image with Gemini API...');
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    });
    let analysis = '';
    if (
      response &&
      response.candidates &&
      response.candidates[0] &&
      response.candidates[0].content &&
      Array.isArray(response.candidates[0].content.parts)
    ) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          analysis += part.text + '\n';
        }
      }
    }

    console.log('Gemini image analysis completed successfully');

    res.json({
      success: true,
      analysis: analysis || 'Image uploaded successfully. The AI was able to process your image.',
      provider: 'gemini'
    });

  } catch (error: any) {
    console.error('Error analyzing image with Gemini:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to analyze image';
    if (error.message?.includes('API_KEY') || error.message?.includes('PERMISSION_DENIED')) {
      errorMessage = 'Gemini API key not properly configured';
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorMessage = 'Gemini API quota exceeded';
    } else if (error.message?.includes('INVALID_ARGUMENT')) {
      errorMessage = 'Invalid image format for Gemini';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
});

// POST /api/ai/generate-posts - Generate social media posts (new endpoint)
router.post('/generate-posts', async (req: Request, res: Response) => {
  const { campaignInfo, contentData, platforms } = req.body

  if (!campaignInfo || !contentData || !platforms) {
    return res.status(400).json({
      error: 'Missing required fields: campaignInfo, contentData, and platforms are required'
    })
  }

  try {
    if (!genAI) {
      return res.status(500).json({ error: 'GoogleGenAI client not initialized' })
    }

    // Create platform-specific prompts
    const generatedPosts = []

    for (const platform of platforms) {
      const prompt = createPlatformPrompt(campaignInfo, contentData, platform)

      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents: [{ text: prompt }]
        })
        
        let text = ''
        if (response?.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.text) {
              text += part.text
            }
          }
        }

        // Parse the generated content to extract caption and hashtags
        const lines = text.split('\n').filter(line => line.trim())
        let caption = text
        let hashtags: string[] = []

        // Try to extract hashtags from the content
        const hashtagMatches = text.match(/#\w+/g)
        if (hashtagMatches) {
          hashtags = hashtagMatches.slice(0, 5) // Limit to 5 hashtags
          // Remove hashtags from caption if they appear at the end
          caption = text.replace(/\n\s*#\w+(\s+#\w+)*\s*$/, '').trim()
        }

        generatedPosts.push({
          platform,
          caption: caption || contentData.prompt,
          hashtags: hashtags.length > 0 ? hashtags : [`#${campaignInfo.name?.replace(/\s+/g, '')?.toLowerCase() || 'business'}`],
          imageUrl: contentData.mediaUrl || null,
          success: true
        })
      } catch (error: any) {
        generatedPosts.push({
          platform,
          caption: contentData.prompt || 'Check out our latest updates!',
          hashtags: [`#${campaignInfo.name?.replace(/\s+/g, '')?.toLowerCase() || 'business'}`],
          imageUrl: contentData.mediaUrl || null,
          error: error.message,
          success: false
        })
      }
    }

    res.json({
      success: true,
      posts: generatedPosts
    })

  } catch (error: any) {
    console.error('AI generation error:', error)

    // Check for quota errors
    if (error.status === 429 || error.message?.includes('quota')) {
      return res.status(429).json({
        error: 'AI API quota exceeded. Please try again later or upgrade your plan.',
        details: 'Gemini API quota exceeded',
        fallback: true
      })
    }

    res.status(500).json({
      error: 'Failed to generate content',
      details: error.message
    })
  }
})

// POST /api/ai/generate - Generate social media posts (legacy endpoint)
router.post('/generate', async (req: Request, res: Response) => {
  const { campaign, content, platforms } = req.body

  if (!campaign || !content || !platforms) {
    return res.status(400).json({
      error: 'Missing required fields: campaign, content, and platforms are required'
    })
  }

  try {
    if (!genAI) {
      return res.status(500).json({ error: 'GoogleGenAI client not initialized' })
    }

    // Create platform-specific prompts
    const generatedPosts = []

    for (const platform of platforms) {
      const prompt = createPlatformPrompt(campaign, content, platform)

      try {
        console.log(`Generating content for ${platform} with prompt:`, prompt.substring(0, 200) + '...')
        
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ text: prompt }]
        })
        
        let text = ''
        if (response?.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.text) {
              text += part.text
            }
          }
        }

        console.log(`Generated content for ${platform}:`, text.substring(0, 200) + '...')

        // Parse the generated content to extract caption and hashtags
        let caption = text.trim()
        let hashtags: string[] = []

        // Try to extract hashtags from the content
        const hashtagMatches = text.match(/#\w+/g)
        if (hashtagMatches) {
          hashtags = [...new Set(hashtagMatches)].slice(0, 5) // Remove duplicates and limit to 5
          // Remove hashtags from caption if they appear at the end
          caption = text.replace(/\n\s*#\w+(\s+#\w+)*\s*$/, '').trim()
        }

        // Add default hashtags if none found
        if (hashtags.length === 0) {
          hashtags = [`#${campaign.name?.replace(/\s+/g, '')?.toLowerCase() || 'business'}`]
        }

        generatedPosts.push({
          platform,
          content: caption,
          caption: caption, // Include both for compatibility
          hashtags: hashtags,
          success: true
        })
      } catch (error: any) {
        console.error(`Error generating for ${platform}:`, error)
        
        generatedPosts.push({
          platform,
          content: content.topic || 'Check out our latest updates!',
          caption: content.topic || 'Check out our latest updates!',
          hashtags: [`#${campaign.name?.replace(/\s+/g, '')?.toLowerCase() || 'business'}`],
          error: error.message,
          success: false
        })
      }
    }

    console.log('Final generated posts:', generatedPosts)

    res.json({
      success: true,
      posts: generatedPosts
    })

  } catch (error: any) {
    console.error('AI generation error:', error)

    // Check for quota errors
    if (error.status === 429 || error.message?.includes('quota')) {
      return res.status(429).json({
        error: 'AI API quota exceeded. Please try again later or upgrade your plan.',
        details: 'Gemini API quota exceeded',
        fallback: true
      })
    }

    res.status(500).json({
      error: 'Failed to generate content',
      details: error.message
    })
  }
})

// Helper function to create platform-specific prompts
function createPlatformPrompt(campaign: any, content: any, platform: string): string {
  const baseInfo = `
Campaign: ${campaign.name}
Industry: ${campaign.industry}
Description: ${campaign.description}
Target Audience: ${content.targetAudience}
Content Topic: ${content.topic}
Content Type: ${content.contentType}
Tone: ${content.tone}
`

  const platformGuidelines = {
    linkedin: `
Create a professional LinkedIn post (max 3000 characters).
- Use professional tone
- Include relevant hashtags
- Focus on business insights or industry trends
- Keep it engaging but informative
`,
    twitter: `
Create a Twitter post (max 280 characters).
- Be concise and engaging
- Use relevant hashtags (2-3 max)
- Consider adding emojis if appropriate
- Make it shareable
`,
    facebook: `
Create a Facebook post (max 2000 characters recommended).
- Be conversational and engaging
- Use storytelling elements
- Include relevant hashtags
- Encourage interaction
`,
    instagram: `
Create an Instagram caption (max 2200 characters).
- Be visual-focused
- Use many relevant hashtags (up to 30)
- Include emojis
- Create engaging, lifestyle-focused content
`,
    tiktok: `
Create TikTok caption (max 150 characters).
- Be trendy and fun
- Use popular hashtags
- Be energetic and engaging
- Focus on entertainment value
`,
    youtube: `
Create YouTube video description.
- Include compelling title suggestion
- Be trendy and fun
- Use popular hashtags
- Be energetic and engaging
- Include relevant keywords and hashtags
- Add call-to-action
` 
  }

  return `${baseInfo}

Platform: ${platform.toUpperCase()}

${platformGuidelines[platform as keyof typeof platformGuidelines] || 'Create engaging social media content for this platform.'}

Please generate compelling content that aligns with the campaign brand and platform requirements. Return only the content without any prefixes or explanations.`
}

// Generate image using DALL-E 3 (Legacy endpoint - keeping for compatibility)
router.post('/generate-image-dalle', async (req: Request, res: Response) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log('Generating image with DALL-E 3:', prompt);

    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: prompt,
        size: size,
        quality: quality,
        style: style, // 'vivid' or 'natural'
        n: 1
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.data || !response.data.data[0]) {
      throw new Error('Invalid response from OpenAI API');
    }

    const imageUrl = response.data.data[0].url;
    const revisedPrompt = response.data.data[0].revised_prompt || prompt;

    res.json({
      success: true,
      imageUrl,
      originalPrompt: prompt,
      revisedPrompt,
      style,
      quality,
      size,
      provider: 'dalle-3'
    });

  } catch (error: any) {
    console.error('Error generating image with DALL-E:', error.response?.data || error.message);

    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        error: error.response.data?.error?.message || 'Invalid request to DALL-E API'
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate image with DALL-E',
      details: error.message
    });
  }
});



// Generate image prompt suggestions based on content
router.post('/suggest-image-prompts', async (req: Request, res: Response) => {
  try {
    const { contentText, platforms = [], industry = '', brandTone = 'professional' } = req.body;

    if (!contentText) {
      return res.status(400).json({ error: 'Content text is required' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const systemPrompt = `You are an expert social media visual designer. Based on the given content text, suggest 3 different image generation prompts that would work well for social media posts.

Consider:
- Industry: ${industry || 'general'}
- Brand tone: ${brandTone}
- Platforms: ${platforms.join(', ') || 'general social media'}

Return only 3 concise, creative image prompts that would complement the content. Each prompt should be specific enough for AI image generation but creative and engaging.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Content: "${contentText}"\n\nGenerate 3 image prompts:`
          }
        ],
        max_tokens: 400
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const suggestions = response.data.choices[0]?.message?.content || 'Unable to generate suggestions';

    // Parse the response into individual prompts
    const prompts = suggestions
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((prompt: string) => prompt.length > 10);

    res.json({
      prompts: prompts.slice(0, 3), // Ensure we only return 3 prompts
      originalContent: contentText
    });

  } catch (error: any) {
    console.error('Error generating image prompts:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate image prompts',
      details: error.message
    });
  }
});

// Unified text generation endpoint with multi-model support
router.post('/generate-text', async (req: Request, res: Response) => {
  try {
    const {
      model = 'gpt-4o',
      prompt,
      systemPrompt,
      maxTokens = 1000,
      temperature = 0.7,
      context
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const modelConfig = AI_MODELS[model];
    if (!modelConfig) {
      return res.status(400).json({ error: `Unsupported model: ${model}` });
    }

    console.log(`Generating text with model: ${model}`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);

    let response;
    let usage;

    switch (modelConfig.provider) {
      case 'openai':
        response = await generateWithOpenAI(modelConfig, prompt, systemPrompt, maxTokens, temperature);
        break;

      case 'google':
        response = await generateWithGemini(modelConfig, prompt, systemPrompt, maxTokens, temperature);
        break;

      case 'anthropic':
        response = await generateWithClaude(modelConfig, prompt, systemPrompt, maxTokens, temperature);
        break;

      default:
        return res.status(400).json({ error: `Unsupported provider: ${modelConfig.provider}` });
    }

    res.json({
      content: response.content,
      model: model,
      usage: response.usage,
      finishReason: response.finishReason
    });

  } catch (error: any) {
    console.error('Error in text generation:', error.message);
    res.status(500).json({
      error: 'Failed to generate text',
      details: error.message
    });
  }
});

// OpenAI text generation
async function generateWithOpenAI(
  modelConfig: AIModel,
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 1000,
  temperature: number = 0.7
) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: modelConfig.id,
      messages: messages,
      max_tokens: Math.min(maxTokens, modelConfig.maxTokens || 4096),
      temperature: temperature,
      stream: false
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const choice = response.data.choices[0];
  return {
    content: choice.message.content,
    usage: response.data.usage,
    finishReason: choice.finish_reason
  };
}

// Google Gemini text generation
async function generateWithGemini(
  modelConfig: AIModel,
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 1000,
  temperature: number = 0.7
) {
  if (!genAI) {
    throw new Error('GoogleGenAI client not initialized');
  }
  
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  
  const response = await genAI.models.generateContent({
    model: modelConfig.id,
    contents: [{ text: fullPrompt }],
    generationConfig: {
      maxOutputTokens: Math.min(maxTokens, modelConfig.maxTokens || 8192),
      temperature: temperature
    }
  });
  
  let content = '';
  if (response?.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        content += part.text;
      }
    }
  }

  return {
    content: content.trim(),
    usage: {
      inputTokens: Math.ceil(fullPrompt.length / 4),
      outputTokens: Math.ceil(content.length / 4),
      totalTokens: Math.ceil((fullPrompt.length + content.length) / 4)
    },
    finishReason: 'stop'
  };
}

// Anthropic Claude text generation
async function generateWithClaude(
  modelConfig: AIModel,
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 1000,
  temperature: number = 0.7
) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: modelConfig.id,
      max_tokens: Math.min(maxTokens, modelConfig.maxTokens || 4096),
      temperature: temperature,
      system: systemPrompt || '',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    }
  );

  const content = response.data.content[0]?.text || '';

  return {
    content: content,
    usage: response.data.usage || {
      inputTokens: Math.ceil(prompt.length / 4),
      outputTokens: Math.ceil(content.length / 4),
      totalTokens: Math.ceil((prompt.length + content.length) / 4)
    },
    finishReason: response.data.stop_reason || 'stop'
  };
}

// Get available text models
router.get('/models', (req: Request, res: Response) => {
  const models = Object.keys(AI_MODELS).map(key => {
    const model = AI_MODELS[key];
    return {
      id: key,
      name: model.id,
      provider: model.provider,
      maxTokens: model.maxTokens,
      isAvailable: true
    };
  });

  res.json({
    models: models,
    defaultModel: 'gpt-4o'
  });
});

// Enhanced image generation with model selection
router.post('/generate-image-enhanced', async (req: Request, res: Response) => {
  try {
    const {
      model = 'dall-e-3',
      prompt,
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid',
      aspectRatio = '1:1'
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let actualSize = size;

    // Convert aspect ratio to size if needed
    if (aspectRatio && model === 'dall-e-3') {
      const sizeMap = {
        '1:1': '1024x1024',
        '16:9': '1792x1024',
        '9:16': '1024x1792'
      };
      actualSize = sizeMap[aspectRatio as keyof typeof sizeMap] || size;
    }

    // For now, only support DALL-E models
    if (model === 'dall-e-3' || model === 'dall-e-2') {
      const response = await generateImageWithDALLE(model, prompt, actualSize, quality, style);
      res.json({
        ...response,
        model: model
      });
    } else {
      res.status(400).json({ error: `Unsupported image model: ${model}` });
    }

  } catch (error: any) {
    console.error('Error generating image:', error.message);
    res.status(500).json({
      error: 'Failed to generate image',
      details: error.message
    });
  }
});

// DALL-E image generation helper
async function generateImageWithDALLE(
  model: string,
  prompt: string,
  size: string,
  quality: string,
  style: string
) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      model: model,
      prompt: prompt,
      size: size,
      quality: model === 'dall-e-3' ? quality : undefined, // DALL-E 2 doesn't support quality
      style: model === 'dall-e-3' ? style : undefined, // DALL-E 2 doesn't support style
      n: 1
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.data || !response.data.data || !response.data.data[0]) {
    throw new Error('Invalid response from OpenAI API');
  }

  const imageUrl = response.data.data[0].url;
  const revisedPrompt = response.data.data[0].revised_prompt || prompt;

  return {
    imageUrl,
    originalPrompt: prompt,
    revisedPrompt,
    style,
    quality,
    size
  };
}

// Import Supabase storage functions
import { uploadImageFromUrl, ensureStorageSetup } from '../lib/supabaseStorage.js'

// Available image generation models - Based on working reference implementation
interface ImageModel {
  id: string;
  name: string;
  description: string;
  provider: string;
}

const availableModels: ImageModel[] = [
  // Gemini Models (Google GenAI)
  {
    id: 'gemini-2.5-flash-image-preview',
    name: '🔮 Gemini 2.5 Flash',
    description: 'Google Gemini AI image generation',
    provider: 'gemini'
  },
  // Pollinations Models (Free & Fast) - No model selection, works by URL only
  {
    id: 'default',
    name: '🌸 Pollinations AI',
    description: 'Free, fast, creative generation',
    provider: 'pollinations'
  },
  
  // Hugging Face Models (Higher Quality, API Key Required)
  {
    id: 'stabilityai/stable-diffusion-xl-base-1.0',
    name: 'Stable Diffusion XL',
    description: 'High quality, detailed images',
    provider: 'huggingface'
  },
  {
    id: 'runwayml/stable-diffusion-v1-5',
    name: 'Stable Diffusion 1.5',
    description: 'Reliable, artistic styles',
    provider: 'huggingface'
  },
  {
    id: 'CompVis/stable-diffusion-v1-4',
    name: 'Stable Diffusion 1.4',
    description: 'Good for photorealistic images',
    provider: 'huggingface'
  },
  {
    id: 'dreamlike-art/dreamlike-diffusion-1.0',
    name: 'Dreamlike Diffusion',
    description: 'Dreamy, artistic style',
    provider: 'huggingface'
  },
  {
    id: 'prompthero/openjourney',
    name: 'OpenJourney',
    description: 'Midjourney-style images',
    provider: 'huggingface'
  }
];

// POST /api/ai/generate-image - Generate image using multiple AI providers
router.post('/generate-image', async (req: Request, res: Response) => {
  try {
    const { 
      prompt, 
      model = 'stabilityai/stable-diffusion-xl-base-1.0',
      style = 'realistic',
      width,
      height,
      aspectRatio,
      seed,
      userId 
    } = req.body

    // Convert aspect ratio to dimensions if width/height not provided
    let finalWidth = width;
    let finalHeight = height;
    
    if (!finalWidth || !finalHeight) {
      const aspectRatioDimensions = {
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1280, height: 720 },
        '9:16': { width: 720, height: 1280 },
        '4:3': { width: 1024, height: 768 }
      };
      
      const dimensions = aspectRatioDimensions[aspectRatio as keyof typeof aspectRatioDimensions] || aspectRatioDimensions['1:1'];
      finalWidth = finalWidth || dimensions.width;
      finalHeight = finalHeight || dimensions.height;
    }

    console.log('AI Image generation request:', {
      userId,
      prompt: prompt?.substring(0, 50) + '...',
      hasUserId: !!userId
    })

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      })
    }

    console.log('AI image generation request:', {
      prompt: prompt.substring(0, 100) + '...',
      style,
      aspectRatio,
      dimensions: `${finalWidth}x${finalHeight}`
    })

    // Always ensure storage bucket exists - we'll always upload to Supabase for social media compatibility
    await ensureStorageSetup()

    // Enhance prompt with style
    const enhancedPrompt = enhancePromptWithStyle(prompt, style)
    console.log('Enhanced prompt:', enhancedPrompt)

    // Generate unique seed if not provided
    const finalSeed = seed || Math.floor(Math.random() * 1000000)

    let imageUrl: string;
    let provider: string;

    // Determine provider based on model selection with Gemini 2.5 Flash Image Preview as default
    const selectedModel = availableModels.find(m => m.id === model);
    const isHuggingFaceModel = selectedModel?.provider === 'huggingface';
    const isGeminiModel = selectedModel?.provider === 'gemini' || model === 'gemini-2.5-flash-image-preview';
    const isPollinationsModel = selectedModel?.provider === 'pollinations' || model === 'default';
    
    if (isGeminiModel) {
      console.log('🔮 Generating image with Gemini 2.5 Flash Image Preview:', model)
      try {
        console.log('Generating image with Gemini API...', enhancedPrompt +`, style: ${style}, width: ${finalWidth}, height: ${finalHeight}`)
        const geminiResult = await generateImageWithGemini(enhancedPrompt +`, style: ${style}, width: ${finalWidth}, height: ${finalHeight}`)
        console.log('Gemini raw result:', geminiResult)
        imageUrl = geminiResult.imageData // This is a base64 data URL
        provider = 'gemini'
        console.log('✅ Gemini generation successful')
      } catch (geminiError: any) {
        console.warn('❌ Gemini failed, falling back to Pollinations:', geminiError.message)
        // Fallback to Pollinations if Gemini fails
        imageUrl = await generateImageWithPollinationsWithRetry(enhancedPrompt, finalWidth, finalHeight, finalSeed)
        provider = 'pollinations'
      }
    } else if (isHuggingFaceModel && model !== 'default') {
      console.log('🤗 Generating image with Hugging Face:', model)
      try {
        imageUrl = await generateImageWithHuggingFace(model, enhancedPrompt, finalWidth, finalHeight)
        provider = 'huggingface'
        console.log('✅ Hugging Face generation successful')
      } catch (hfError: any) {
        console.warn('❌ Hugging Face failed, falling back to Pollinations:', hfError.message)
        // Fallback to Pollinations if Hugging Face fails
        imageUrl = await generateImageWithPollinationsWithRetry(enhancedPrompt, finalWidth, finalHeight, finalSeed)
        provider = 'pollinations'
      }
    } else {
      console.log('🌸 Generating image with Pollinations AI (free) with retry logic')
      imageUrl = await generateImageWithPollinationsWithRetry(enhancedPrompt, finalWidth, finalHeight, finalSeed)
      provider = 'pollinations'
    }

    // Image validation is now handled within the retry logic for Pollinations

    let finalImageUrl = imageUrl
    let supabaseUrl = null

    // Always upload to Supabase for social media compatibility (Facebook needs accessible URLs)
    try {
      console.log('⬆️ Uploading generated image to Supabase for social media compatibility...')
      const uploadResult = await uploadImageFromUrl(imageUrl, {
        folder: userId ? `users/${userId}/ai-generated` : 'ai-generated',
        fileName: `${provider}-${finalSeed}-${Date.now()}`,
        makePublic: true, // Ensure the bucket/file is public for Facebook access
        // Don't use signed URLs for social media - use public URLs instead
        signedUrlExpiresInSeconds: undefined
      })

      if (uploadResult.success && uploadResult.publicUrl) {
        supabaseUrl = uploadResult.publicUrl
        finalImageUrl = supabaseUrl
        console.log('✅ Successfully uploaded to Supabase (using PUBLIC URL for social media):', supabaseUrl)
      } else {
        console.warn('⚠️ Supabase upload failed, using direct URL instead:', uploadResult.error)
        console.log(`Direct ${provider} URL will be used:`, imageUrl)
        // Continue with original URL if upload fails
      }
    } catch (uploadError) {
      console.error('❌ Supabase upload error:', uploadError)
      console.log(`Using direct ${provider} URL as fallback`)
      // Continue with original URL if upload fails
    }

    res.json({
      success: true,
      imageUrl: finalImageUrl,
      directUrl: imageUrl,
      supabaseUrl,
      prompt: enhancedPrompt,
      originalPrompt: prompt,
      model,
      style,
      seed: finalSeed,
      dimensions: { width: finalWidth, height: finalHeight },
      size: `${finalWidth}x${finalHeight}`,
      generatedAt: new Date().toISOString(),
      provider
    })

  } catch (error: any) {
    console.error('AI image generation failed:', error)
    
    res.status(500).json({
      success: false,
      error: 'Image generation failed',
      details: error.message || 'Unknown error occurred',
      provider: 'pollinations'
    })
  }
})



// Pollinations image generation helper with retry logic for 0kb images
async function generateImageWithPollinationsWithRetry(
  prompt: string,
  width: number,
  height: number,
  seed: number,
  maxRetries: number = 5
): Promise<string> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    console.log(`🌸 Generating image with Pollinations AI (attempt ${attempt}/${maxRetries})`);
    
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      // Add random seed variation for retry attempts
      const currentSeed = seed + attempt - 1;
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${currentSeed}&nologo=true`;
      
      // Test if the image is valid (not 0kb)
      console.log(`🔍 Testing Pollinations image (attempt ${attempt}):`, url.substring(0, 100) + '...');
      const testResponse = await axios.head(url, { 
        timeout: 15000,
        maxRedirects: 5 
      });
      
      const contentLength = parseInt(testResponse.headers['content-length'] || '0');
      const contentType = testResponse.headers['content-type'] || '';
      
      console.log(`📊 Pollinations response (attempt ${attempt}):`, {
        contentLength,
        contentType,
        status: testResponse.status
      });
      
      // Check if image is valid (not 0kb and has proper content type)
      if (contentLength > 1000 && contentType.startsWith('image/')) {
        console.log(`✅ Pollinations generation successful (attempt ${attempt}): ${contentLength} bytes`);
        return url;
      } else if (contentLength === 0) {
        console.warn(`⚠️  Pollinations returned 0kb image (attempt ${attempt}), retrying...`);
        if (attempt < maxRetries) {
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      } else {
        console.warn(`⚠️  Pollinations returned small/invalid image (attempt ${attempt}): ${contentLength} bytes, retrying...`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }
    } catch (error: any) {
      console.error(`❌ Pollinations error (attempt ${attempt}):`, error.message);
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying Pollinations in ${attempt * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
    }
  }
  
  // If all retries failed, return the last attempt URL anyway
  console.error(`❌ All ${maxRetries} Pollinations attempts failed, returning last URL`);
  const encodedPrompt = encodeURIComponent(prompt);
  const fallbackSeed = seed + maxRetries;
  const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${fallbackSeed}&nologo=true`;
  return fallbackUrl;
}

// Legacy Pollinations helper (kept for compatibility)
async function generateImageWithPollinations(
  prompt: string,
  width: number,
  height: number,
  seed: number
): Promise<string> {
  try {
    console.log('🌸 Generating image with Pollinations AI (legacy)');
    
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
    
    // For Pollinations, the URL itself is the image
    return url;
    
  } catch (error: any) {
    console.error('Pollinations error:', error);
    throw new Error(`Pollinations failed: ${error.message}`);
  }
}

// Gemini image generation helper function
async function generateImageWithGemini(prompt: string): Promise<{ imageData: string; mimeType: string; base64: string }> {
  if (!process.env.VITE_GEMINI_API_KEY || !genAI) {
    throw new Error('Gemini API key not configured or GoogleGenAI client not available');
  }

  console.log('🔮 Generating image with Gemini 2.5 Flash Image Preview using @google/genai');

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    
    // Check for generated images in the response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No image generated by Gemini');
    }

    // Extract image data from the first candidate
    for (const candidate of candidates) {
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType && part.inlineData.data) {
            // Create base64 data URL
            const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            return {
              imageData: imageData,
              mimeType: part.inlineData.mimeType,
              base64: part.inlineData.data
            };
          }
        }
      }
    }

    throw new Error('No image data found in Gemini response');

  } catch (error: any) {
    console.error('Gemini image generation error:', error);
    
    let errorMessage = 'Failed to generate image with Gemini';
    if (error.message?.includes('API_KEY') || error.message?.includes('PERMISSION_DENIED')) {
      errorMessage = 'Gemini API key not properly configured';
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorMessage = 'Gemini API quota exceeded';
    } else if (error.message?.includes('INVALID_ARGUMENT')) {
      errorMessage = 'Invalid prompt for Gemini image generation';
    }
    
    throw new Error(errorMessage);
  }
}

// Hugging Face image generation helper - matches reference implementation exactly
async function generateImageWithHuggingFace(
  model: string, 
  prompt: string, 
  width: number, 
  height: number
): Promise<string> {
  const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
  
  // API key validation exactly like reference
  if (!HF_API_KEY || !HF_API_KEY.startsWith('hf_')) {
    console.warn('No valid Hugging Face API key provided, skipping Hugging Face API');
    throw new Error('🔑 Invalid API token. Please check your Hugging Face API key at https://huggingface.co/settings/tokens');
  }

  // Clean up model ID for Hugging Face
  let hfModel = model;
  if (model.includes('-hf')) {
    hfModel = model.replace('-hf', '');
  }

  console.log(`🤗 Using Hugging Face model: ${hfModel}`);

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${hfModel}`,
      {
        inputs: prompt,
        parameters: {
          num_inference_steps: 20,
          guidance_scale: 7.5
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'image/png'
        },
        responseType: 'arraybuffer',
        timeout: 60000 // 60 second timeout
      }
    );

    if (!response.data) {
      throw new Error('Invalid response from Hugging Face API');
    }

    // Check for JSON error response
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      const jsonResponse = JSON.parse(Buffer.from(response.data).toString());
      if (jsonResponse.error) {
        throw new Error(jsonResponse.error);
      }
    }

    const buffer = Buffer.from(response.data);
    if (buffer.length === 0) {
      throw new Error('Received empty response from API');
    }

    // Create blob URL from buffer - matching reference implementation
    const base64 = buffer.toString('base64');
    return `data:image/png;base64,${base64}`;
    
  } catch (error: any) {
    console.error('Hugging Face API error:', error.response?.data || error.message);
    
    // Error handling exactly like reference
    if (error.response?.status === 401) {
      throw new Error('🔑 Invalid API token. Please check your Hugging Face API key at https://huggingface.co/settings/tokens');
    }
    if (error.response?.status === 429) {
      throw new Error('⏰ Rate limit exceeded. Please wait a moment and try again, or add your API key for higher limits.');
    }
    if (error.response?.status === 503) {
      throw new Error('🔄 Model is currently loading. Please wait 1-2 minutes and try again. This is normal for less popular models.');
    }
    if (error.response?.status === 404) {
      console.warn(`Model "${model}" not found, trying alternative services...`);
      throw new Error(`❌ Model "${model}" not found on Hugging Face`);
    }
    if (error.response?.status >= 500) {
      throw new Error('🛠️ Hugging Face servers are experiencing issues. Trying alternative services...');
    }
    
    throw new Error(`🚫 Hugging Face API error (${error.response?.status}). ${error.message}`);
  }
}

// Helper function to enhance prompts with style
function enhancePromptWithStyle(prompt: string, style: string): string {
  const styleEnhancements: Record<string, string> = {
    realistic: 'realistic, high quality, detailed, photorealistic',
    artistic: 'artistic, creative, stylized, beautiful composition',
    cartoon: 'cartoon style, animated, colorful, fun illustration',
    abstract: 'abstract art, modern, creative composition, artistic',
    vintage: 'vintage style, retro, classic aesthetic, nostalgic',
    modern: 'modern, contemporary, clean design, minimalist',
    fantasy: 'fantasy art, magical, ethereal, mystical atmosphere',
    cyberpunk: 'cyberpunk, futuristic, neon lights, digital art',
    watercolor: 'watercolor painting, soft colors, artistic brush strokes',
    oil_painting: 'oil painting, classical art style, rich textures'
  }

  const enhancement = styleEnhancements[style] || styleEnhancements.realistic
  return `${prompt}, ${enhancement}`
}

// POST /api/ai/suggest-image-prompts - Suggest image prompts based on content
router.post('/suggest-image-prompts', async (req: Request, res: Response) => {
  try {
    const { contentText, platforms, industry, brandTone } = req.body

    if (!contentText) {
      return res.status(400).json({ error: 'Content text is required' })
    }

    // Generate AI-powered prompts based on content
    const prompts = [
      `Professional ${industry || 'business'} image representing: ${contentText.substring(0, 100)}`,
      `${brandTone || 'Professional'} style visual for social media about: ${contentText.substring(0, 80)}`,
      `Engaging ${platforms?.join(' and ') || 'social media'} image illustrating: ${contentText.substring(0, 90)}`
    ]

    res.json({
      success: true,
      prompts
    })
  } catch (error: any) {
    console.error('Prompt suggestion error:', error)
    res.status(500).json({ error: 'Failed to generate prompt suggestions' })
  }
})

// POST /api/ai/generate-image-gemini - Generate image using Gemini 2.5 Flash Image Preview
router.post('/generate-image-gemini', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    if (!process.env.VITE_GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured'
      });
    }

    console.log('Generating image with Gemini 2.5 Flash Image Preview:', prompt);

    if (!genAI) {
      return res.status(500).json({
        success: false,
        error: 'GoogleGenAI client not initialized'
      });
    }

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    
    // Check for generated images in the response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'No image generated'
      });
    }

    const generatedImages = [];
    
    for (const candidate of candidates) {
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType && part.inlineData.data) {
            // Create base64 data URL
            const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            generatedImages.push({
              imageData: imageData,
              mimeType: part.inlineData.mimeType,
              base64: part.inlineData.data
            });
          }
        }
      }
    }

    if (generatedImages.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'No image data found in response'
      });
    }

    // Return the first generated image
    const image = generatedImages[0];
    
    res.json({
      success: true,
      imageData: image.imageData,
      base64: image.base64,
      mimeType: image.mimeType,
      prompt: prompt,
      generatedAt: new Date().toISOString(),
      provider: 'gemini',
      model: 'gemini-2.5-flash-image-preview'
    });

  } catch (error: any) {
    console.error('Error generating image with Gemini:', error);
    
    let errorMessage = 'Failed to generate image with Gemini';
    if (error.message?.includes('API_KEY') || error.message?.includes('PERMISSION_DENIED')) {
      errorMessage = 'Gemini API key not properly configured';
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorMessage = 'Gemini API quota exceeded';
    } else if (error.message?.includes('INVALID_ARGUMENT')) {
      errorMessage = 'Invalid prompt for Gemini image generation';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
});

// Get available image models
router.get('/image-models', (req: Request, res: Response) => {
  try {
    // Check API key availability for different providers
    const checkApiKeys = {
      gemini: !!process.env.VITE_GEMINI_API_KEY && !!genAI,
      huggingface: !!process.env.HUGGING_FACE_API_KEY && process.env.HUGGING_FACE_API_KEY.startsWith('hf_'),
      pollinations: true // Always available (free)
    };

    // Add availability status to models
    const modelsWithAvailability = availableModels.map(model => ({
      ...model,
      isAvailable: checkApiKeys[model.provider as keyof typeof checkApiKeys] || false
    }));

    res.json({
      success: true,
      models: modelsWithAvailability,
      defaultModel: 'stabilityai/stable-diffusion-xl-base-1.0'
    });
  } catch (error: any) {
    console.error('Error fetching image models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch image models',
      details: error.message
    });
  }
});

export default router
