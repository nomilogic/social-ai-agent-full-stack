import express, { Request, Response } from 'express'
import axios from 'axios'
import { uploadImageFromUrl, ensureStorageSetup } from '../lib/supabaseStorage.js'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

export interface GenerateImageRequest {
  prompt: string
  style?: string
  userId?: string
  width?: number
  height?: number
  seed?: number
  saveToStorage?: boolean
}

export interface GenerateTextRequest {
  prompt: string
  type?: 'story' | 'article' | 'email' | 'code' | 'poem' | 'summary' | 'chat' | 'custom'
  model?: string
  maxLength?: number
  userId?: string
}

// POST /api/ai-content/generate-image - Generate image using Pollinations AI
router.post('/generate-image', async (req: Request, res: Response) => {
  const { 
    prompt, 
    style = 'realistic',
    userId,
    width = 1024,
    height = 1024,
    seed,
    saveToStorage = true 
  }: GenerateImageRequest = req.body

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Prompt is required'
    })
  }

  console.log('AI image generation request:', {
    prompt: prompt.substring(0, 100) + '...',
    style,
    userId,
    dimensions: `${width}x${height}`,
    saveToStorage
  })

  try {
    // Ensure storage bucket exists if we're saving
    if (saveToStorage) {
      await ensureStorageSetup()
    }

    // Enhance prompt with style
    const enhancedPrompt = enhancePromptWithStyle(prompt, style)
    console.log('Enhanced prompt:', enhancedPrompt)

    // Generate unique seed if not provided
    const finalSeed = seed || Math.floor(Math.random() * 1000000)

    // Generate image using Pollinations AI
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&nologo=true&enhance=true`
    
    console.log('Pollinations AI URL:', pollinationsUrl)

    // Test if the image generates successfully
    try {
      const testResponse = await axios.head(pollinationsUrl, { timeout: 10000 })
      console.log('Image generation successful, content-type:', testResponse.headers['content-type'])
    } catch (testError) {
      console.warn('Image generation test failed, but continuing...', testError)
    }

    let finalImageUrl = pollinationsUrl
    let supabaseUrl = null

    // Upload to Supabase if requested
    if (saveToStorage) {
      try {
        console.log('Uploading generated image to Supabase...')
        const uploadResult = await uploadImageFromUrl(pollinationsUrl, {
          folder: userId ? `users/${userId}/generated` : 'generated',
          fileName: `pollinations-${finalSeed}-${Date.now()}`,
        })

        if (uploadResult.success && uploadResult.publicUrl) {
          supabaseUrl = uploadResult.publicUrl
          finalImageUrl = uploadResult.publicUrl
          console.log('Successfully uploaded to Supabase:', supabaseUrl)
        } else {
          console.warn('Supabase upload failed:', uploadResult.error)
          // Continue with original URL if upload fails
        }
      } catch (uploadError) {
        console.warn('Supabase upload error:', uploadError)
        // Continue with original URL if upload fails
      }
    }

    const response = {
      success: true,
      data: {
        imageUrl: finalImageUrl,
        pollinationsUrl,
        supabaseUrl,
        prompt: enhancedPrompt,
        originalPrompt: prompt,
        style,
        seed: finalSeed,
        dimensions: { width, height },
        generatedAt: new Date().toISOString()
      },
      message: 'Image generated successfully with Pollinations AI'
    }

    console.log('Sending success response:', { ...response, data: { ...response.data, imageUrl: '[REDACTED]' } })
    res.json(response)

  } catch (error: any) {
    console.error('AI image generation failed:', error)
    
    res.status(500).json({
      success: false,
      error: 'Image generation failed',
      details: error.message || 'Unknown error occurred',
      fallbackAvailable: true
    })
  }
})

// POST /api/ai-content/generate-text - Generate text using Pollinations AI
router.post('/generate-text', async (req: Request, res: Response) => {
  const {
    prompt,
    type = 'custom',
    model = 'mistral',
    maxLength = 500,
    userId
  }: GenerateTextRequest = req.body

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Prompt is required'
    })
  }

  console.log('AI text generation request:', {
    prompt: prompt.substring(0, 100) + '...',
    type,
    model,
    maxLength,
    userId
  })

  try {
    // Enhance prompt based on type
    const enhancedPrompt = enhancePromptForType(prompt, type)
    console.log('Enhanced prompt:', enhancedPrompt)

    // Generate text using Pollinations AI
    const encodedPrompt = encodeURIComponent(enhancedPrompt.trim())
    const pollinationsUrl = `https://text.pollinations.ai/${encodedPrompt}?model=${model}&json=false`
    
    console.log('Making request to Pollinations text API...')
    const response = await axios.get(pollinationsUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'S-AI-Bot/1.0'
      }
    })
    
    if (!response.data || typeof response.data !== 'string') {
      throw new Error('Invalid response from Pollinations AI')
    }
    
    let generatedText = response.data.trim()
    
    // Apply length limitation if needed
    if (generatedText.length > maxLength * 6) { // Rough character to word ratio
      const words = generatedText.split(' ')
      generatedText = words.slice(0, maxLength).join(' ')
      if (words.length > maxLength) {
        generatedText += '...'
      }
    }
    
    const responseData = {
      success: true,
      data: {
        text: generatedText,
        prompt: enhancedPrompt,
        originalPrompt: prompt,
        type,
        model,
        maxLength,
        wordCount: generatedText.split(' ').length,
        generatedAt: new Date().toISOString()
      },
      message: 'Text generated successfully with Pollinations AI'
    }

    console.log('Text generation successful, word count:', responseData.data.wordCount)
    res.json(responseData)

  } catch (error: any) {
    console.error('AI text generation failed:', error)
    
    // Provide fallback text
    const fallbackText = generateFallbackText(prompt, type, maxLength)
    
    res.status(200).json({
      success: true,
      data: {
        text: fallbackText,
        prompt,
        originalPrompt: prompt,
        type,
        model,
        maxLength,
        wordCount: fallbackText.split(' ').length,
        generatedAt: new Date().toISOString(),
        isFallback: true
      },
      message: 'Used fallback text generation (Pollinations AI unavailable)',
      warning: error.message
    })
  }
})

// GET /api/ai-content/storage/list - List user's generated images
router.get('/storage/list', async (req: Request, res: Response) => {
  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required'
    })
  }

  try {
    await ensureStorageSetup()
    
    // This would require implementing storage listing functionality
    res.json({
      success: true,
      data: {
        images: [],
        message: 'Storage listing not yet implemented'
      }
    })
  } catch (error: any) {
    console.error('Error listing storage:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to list storage',
      details: error.message
    })
  }
})

// Helper Functions

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

function enhancePromptForType(prompt: string, type: string): string {
  const typeEnhancements: Record<string, string> = {
    story: `Write a creative and engaging story about: ${prompt}`,
    article: `Write a comprehensive and informative article about: ${prompt}`,
    email: `Write a professional email regarding: ${prompt}`,
    code: `Generate clean and well-documented code for: ${prompt}`,
    poem: `Write a beautiful and meaningful poem about: ${prompt}`,
    summary: `Create a clear and concise summary of: ${prompt}`,
    chat: `Respond conversationally and helpfully to: ${prompt}`,
    custom: prompt
  }
  
  return typeEnhancements[type] || prompt
}

function generateFallbackText(prompt: string, type: string, maxLength: number): string {
  const fallbackTemplates: Record<string, string> = {
    story: `Once upon a time, there was an interesting story about ${prompt}. This tale would unfold with compelling characters and meaningful events, creating a narrative that captures the imagination and leaves a lasting impression on readers.`,
    article: `# About ${prompt}\n\nThis topic represents an important area of interest that deserves thoughtful consideration. Through careful analysis and research, we can better understand the various aspects and implications surrounding ${prompt}.`,
    email: `Subject: Regarding ${prompt}\n\nDear Recipient,\n\nI hope this message finds you well. I am writing to discuss ${prompt} and would like to share some important information with you.\n\nBest regards,\nYour Assistant`,
    code: `// Code implementation for: ${prompt}\nfunction implementation() {\n  // This is a demonstration of code structure\n  console.log('Implementation would be provided here');\n  return 'Generated code example';\n}`,
    poem: `A reflection on ${prompt}:\n\nIn words that flow like gentle streams,\nWe find the essence of our dreams.\nThrough verses crafted with care and grace,\nWe give our thoughts a special place.`,
    summary: `Summary: ${prompt} represents a significant topic that encompasses various important aspects. This overview provides key insights and essential information for better understanding.`,
    chat: `That's an interesting question about ${prompt}! I'd be happy to discuss this topic with you. There are many fascinating aspects to consider, and I think you'll find it quite engaging.`,
    custom: `Here are some thoughts about ${prompt}: This topic offers many interesting perspectives and considerations that are worth exploring further.`
  }

  let text = fallbackTemplates[type] || fallbackTemplates.custom
  
  // Truncate if needed
  if (text.length > maxLength * 6) {
    const words = text.split(' ')
    text = words.slice(0, maxLength).join(' ') + '...'
  }
  
  return text + '\n\n---\n*This is a fallback response. Pollinations AI provides enhanced text generation when available.*'
}

export default router
