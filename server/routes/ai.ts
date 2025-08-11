import express, { Request, Response } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'

const router = express.Router()

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!)

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

export default router
