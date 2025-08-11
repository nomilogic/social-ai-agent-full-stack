import express, { Request, Response } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
// import dotenv from 'dotenv'

// dotenv.config() // Environment variables are handled by Replit

const router = express.Router()

// Initialize AI Services
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || null

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

// POST /api/ai/generate - Generate social media content using AI
router.post('/generate', async (req: Request, res: Response) => {
  const { company, content, platforms } = req.body

  if (!company || !content || !platforms) {
    return res.status(400).json({ 
      error: 'Missing required fields: company, content, and platforms are required' 
    })
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    // Create platform-specific prompts
    const generatedPosts = []
    
    for (const platform of platforms) {
      const prompt = createPlatformPrompt(company, content, platform)
      
      try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        generatedPosts.push({
          platform,
          content: text,
          success: true
        })
      } catch (error: any) {
        generatedPosts.push({
          platform,
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
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message 
    })
  }
})

// Helper function to create platform-specific prompts
function createPlatformPrompt(company: any, content: any, platform: string): string {
  const baseInfo = `
Company: ${company.name}
Industry: ${company.industry}
Description: ${company.description}
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
- Write detailed description with timestamps if relevant
- Include relevant keywords and hashtags
- Add call-to-action
`
  }

  return `${baseInfo}

Platform: ${platform.toUpperCase()}

${platformGuidelines[platform as keyof typeof platformGuidelines] || 'Create engaging social media content for this platform.'}

Please generate compelling content that aligns with the company brand and platform requirements. Return only the content without any prefixes or explanations.`
}

// Generate image using DALL-E 3
router.post('/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log('Generating image with prompt:', prompt);

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
      imageUrl,
      originalPrompt: prompt,
      revisedPrompt,
      style,
      quality,
      size
    });

  } catch (error: any) {
    console.error('Error generating image:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      return res.status(400).json({ 
        error: error.response.data?.error?.message || 'Invalid request to image generation API' 
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate image', 
      details: error.message 
    });
  }
});

// Analyze image using GPT-4 Vision (for uploaded images)
router.post('/analyze-image', async (req: Request, res: Response) => {
  try {
    const { imageUrl, prompt = "Analyze this image and describe what would make good social media content based on it." } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log('Analyzing image:', imageUrl);

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const analysis = response.data.choices[0]?.message?.content || 'Unable to analyze image';

    res.json({
      analysis,
      imageUrl
    });

  } catch (error: any) {
    console.error('Error analyzing image:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to analyze image', 
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
  const model = genAI.getGenerativeModel({ 
    model: modelConfig.id,
    generationConfig: {
      maxOutputTokens: Math.min(maxTokens, modelConfig.maxTokens || 8192),
      temperature: temperature
    }
  });

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  
  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  const content = response.text();

  return {
    content: content,
    usage: {
      // Gemini doesn't provide detailed usage stats in the free tier
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

// Get available models
router.get('/models', (req: Request, res: Response) => {
  const availableModels = Object.keys(AI_MODELS).map(key => {
    const model = AI_MODELS[key];
    return {
      id: key,
      name: model.id,
      provider: model.provider,
      maxTokens: model.maxTokens,
      isAvailable: true // You could add logic to check API key availability
    };
  });

  res.json({
    models: availableModels,
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

export default router
