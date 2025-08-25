import { Router, Request, Response } from 'express';
import { db } from '../db';
import { scheduled_posts, campaigns, campaigns } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import jwt from 'jsonwebtoken';

const router = Router();

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    (req as any).user = user;
    next();
  });
};

// Initialize AI services conditionally based on available API keys
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!);

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

interface ScheduleRequest {
  prompt: string;
  category?: string;
  platforms: string[];
  timePreference?: 'morning' | 'afternoon' | 'evening' | 'custom';
  customTime?: string;
  keywords?: string[];
  campaignId: string;
}

interface GeneratedSchedule {
  id: string;
  date: string;
  time: string;
  content: string;
  imagePrompt?: string;
  platform: string[];
  category: string;
  isLive?: boolean;
  reasoning?: string;
  campaignId: string;
}

/**
 * Generate text using the selected AI model
 */
async function generateAIText(prompt: string, model: string): Promise<string> {
  try {
    if (model.startsWith('gpt-')) {
      // OpenAI models
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert social media strategist and content creator. Follow instructions exactly and return only the requested format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      return completion.choices[0]?.message?.content || '';
    } else if (model.startsWith('gemini-')) {
      // Google Gemini models
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } else if (model.startsWith('claude-')) {
      // Anthropic Claude models
      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Extract text from Claude's response format
      if (message.content && Array.isArray(message.content)) {
        const textContent = message.content.find(c => c.type === 'text');
        return textContent ? textContent.text : '';
      }
      return '';
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  } catch (error) {
    console.error(`Error generating text with ${model}:`, error);
    throw error;
  }
}

/**
 * Generate fallback schedule when AI parsing fails
 */
function generateFallbackSchedule(request: ScheduleRequest): any[] {
  const currentDate = new Date();
  const schedule = [];

  // Default templates based on category
  const contentTemplates = {
    'Technology': [
      'Exploring the latest innovations in {industry}. What trends are you watching? #TechTrends #Innovation',
      'Monday motivation: Every expert was once a beginner. Keep learning and growing! #MondayMotivation #Growth',
      'Quick tip: {tip} What\'s your favorite productivity hack? #ProductivityTips #Efficiency'
    ],
    'Marketing': [
      'Marketing insight: Understanding your audience is the foundation of successful campaigns. #MarketingTips #Strategy',
      'Content is king, but engagement is queen. How do you engage your audience? #ContentMarketing #Engagement',
      'The best marketing doesn\'t feel like marketing. Share value first. #MarketingWisdom #ValueFirst'
    ],
    'General': [
      'Starting the week strong with new goals and fresh perspectives. What\'s your focus this week? #MondayMotivation',
      'Teamwork makes the dream work. Celebrating collaboration and shared success. #Teamwork #Success',
      'Innovation happens when we embrace change and think differently. #Innovation #Growth'
    ]
  };

  const templates = contentTemplates[request.category as keyof typeof contentTemplates] || contentTemplates['General'];
  const timePrefs = {
    'morning': ['09:00', '10:00', '11:00'],
    'afternoon': ['13:00', '14:00', '15:00'],
    'evening': ['17:00', '18:00', '19:00']
  };

  //const times = request.customTime ? [request.customTime] : timePrefs[request.timePreference || 'morning'];

  const times = request.customTime
    ? [request.customTime]
    : (request.timePreference && request.timePreference !== 'custom'
      ? timePrefs[request.timePreference]
      : timePrefs.morning
    );
  // Generate 3-5 posts over the next week
  const numberOfPosts = Math.min(parseInt(request.prompt.match(/\d+/)?.[0] || '3'), 5);

  for (let i = 0; i < numberOfPosts; i++) {
    const postDate = new Date(currentDate);
    postDate.setDate(currentDate.getDate() + i * 2); // Every other day

    const template = templates[i % templates.length];

    schedule.push({
      id: `fallback_${Date.now()}_${i}`,
      date: postDate.toISOString().split('T')[0],
      time: times[i % times.length],
      content: template.replace('{industry}', request.category || 'technology').replace('{tip}', 'Focus on one task at a time for better results'),
      imagePrompt: `Professional ${request.category || 'business'} themed image with modern design, clean composition, corporate colors`,
      platform: request.platforms,
      category: request.category || 'General',
      isLive: false,
      reasoning: 'Fallback content generated due to AI parsing error'
    });
  }

  return schedule;
}

/**
 * Generate AI-powered posting schedule
 */
router.post('/ai/generate-schedule', async (req: Request, res: Response) => {
  try {
    const request: ScheduleRequest & { preferredModel?: string } = req.body;

    if (!request.prompt || !request.platforms || request.platforms.length === 0 || !request.campaignId) {
      return res.status(400).json({ error: 'Missing required fields: prompt, platforms, and campaignId are required' });
    }

    // Get campaign data for context
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', request.campaignId)
      .single();

    // Determine which AI model to use
    const selectedModel = request.preferredModel || process.env.DEFAULT_SCHEDULING_MODEL || 'gpt-4-turbo';
    console.log('Using AI model for scheduling:', selectedModel);

    // Get current date for better context
    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().split('T')[0];

    // Determine optimal posting times based on platforms and preferences
    const getOptimalTimes = () => {
      const times = {
        morning: ['09:00', '10:00', '11:00'],
        afternoon: ['13:00', '14:00', '15:00'],
        evening: ['17:00', '18:00', '19:00']
      };

      if (request.customTime) return [request.customTime];

      // Handle the case where timePreference might be 'custom' or undefined
      const timeKey = (request.timePreference === 'custom' || !request.timePreference)
        ? 'morning'
        : request.timePreference;

      return times[timeKey];
    };

    // Create enhanced AI prompt for schedule generation
    const aiPrompt = `
You are an expert social media strategist and content creator. Generate a detailed, strategic posting schedule.

CURRENT DATE: ${currentDateStr}

REQUEST ANALYSIS:
- User Request: "${request.prompt}"
- Target Platforms: ${request.platforms.join(', ')}
- Content Category: ${request.category || 'General'}
- Keywords: ${request.keywords?.join(', ') || 'None specified'}
- Time Preference: ${request.timePreference || 'flexible'}
- Suggested Times: ${getOptimalTimes().join(', ')}

COMPANY PROFILE:
${campaignData ? `
- Campaign: ${campaignData.name}
- Industry: ${campaignData.industry || 'Technology'}
- Description: ${campaignData.description || 'Professional services campaign'}
- Target Audience: ${campaignData.target_audience || 'Business professionals'}
- Brand Voice: ${campaignData.brand_voice || 'Professional and engaging'}
` : '- Generic business profile'}

TASK: Analyze the request and create a strategic posting schedule following these steps:

1. PARSE THE REQUEST:
   - Identify frequency (daily/weekly/specific pattern)
   - Determine duration (how many posts over what timeframe)
   - Extract content themes and topics
   - Note any specific timing requirements

2. OPTIMAL TIMING STRATEGY:
   - LinkedIn: Best at 8-10 AM, 12-2 PM, 5-6 PM on weekdays
   - Twitter: Best at 9 AM, 1-3 PM, 5-6 PM
   - Instagram: Best at 11 AM-1 PM, 7-9 PM
   - Facebook: Best at 1-3 PM, 7-9 PM
   - Consider timezone: assume business hours in user's locale

3. CONTENT STRATEGY:
   - Vary post types: educational, inspirational, behind-the-scenes, industry news
   - Platform-specific optimization (character limits, hashtag strategies)
   - Include relevant hashtags (3-5 for LinkedIn, 1-2 for Twitter, 5-10 for Instagram)
   - Make content actionable and engaging
   - Use "live" flag for time-sensitive or trending topics

4. IMAGE STRATEGY:
   - Include detailed image prompts for visual content
   - Consider brand consistency and platform requirements
   - Describe style, composition, colors, and key elements

IMPORTANT: You MUST return ONLY valid JSON. No additional text before or after.

JSON STRUCTURE (return exactly in this format):
[
  {
    "id": "schedule_YYYYMMDD_001",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "content": "Engaging post content with relevant #hashtags and @mentions. Keep within platform limits.",
    "imagePrompt": "Detailed description for AI image generation: style, subject, composition, colors, mood (optional but recommended)",
    "platform": ["linkedin"],
    "category": "${request.category || 'General'}",
    "isLive": false,
    "reasoning": "Strategic explanation for timing, content choice, and audience targeting"
  }
]

Generate ${Math.min(parseInt(request.prompt.match(/\d+/)?.[0] || '5'), 20)} posts maximum. Focus on quality over quantity.
    `;

    // Generate using the selected AI model
    const text = await generateAIText(aiPrompt, selectedModel);

    // Parse the JSON response from AI with improved error handling
    let scheduleData: any[];
    try {
      console.log('Raw AI Response:', text);

      // Clean the response - remove any markdown formatting
      let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Extract JSON from the response (AI might include additional text)
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        scheduleData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }

      // Validate the parsed data
      if (!Array.isArray(scheduleData)) {
        throw new Error('Schedule data is not an array');
      }

      if (scheduleData.length === 0) {
        throw new Error('Schedule data is empty');
      }

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Original text:', text);

      // Generate fallback schedule
      scheduleData = generateFallbackSchedule(request);
      console.log('Using fallback schedule:', scheduleData);
    }

    // Validate and enhance the generated schedule
    const enhancedSchedule: GeneratedSchedule[] = scheduleData.map((item, index) => ({
      id: item.id || `schedule_${Date.now()}_${index}`,
      date: item.date,
      time: item.time,
      content: item.content,
      imagePrompt: item.imagePrompt,
      platform: Array.isArray(item.platform) ? item.platform : request.platforms,
      category: item.category || request.category || 'General',
      isLive: Boolean(item.isLive),
      reasoning: item.reasoning,
      campaignId: request.campaignId
    }));

    res.json(enhancedSchedule);
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ error: 'Failed to generate AI schedule' });
  }
});

/**
 * Save generated schedule to database
 */
router.post('/schedule/save', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { schedule }: { schedule: GeneratedSchedule[] } = req.body;

    if (!schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ error: 'Invalid schedule data' });
    }

    // Prepare data for database insertion
    const scheduledPosts = schedule.map(item => ({
      id: item.id,
      campaign_id: item.campaignId,
      date: item.date,
      time: item.time,
      content: item.content,
      image_prompt: item.imagePrompt,
      platforms: item.platform,
      category: item.category,
      status: 'scheduled' as const,
      is_live: Boolean(item.isLive),
      reasoning: item.reasoning
    }));

    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert(scheduledPosts)
      .select();

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error saving schedule:', error);
    res.status(500).json({ error: 'Failed to save schedule' });
  }
});

/**
 * Get scheduled posts for a campaign
 */
router.get('/schedule/posts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { campaignId, startDate, endDate } = req.query;

    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }

    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform database format to client format
    const transformedPosts = data?.map(post => ({
      id: post.id,
      date: post.date,
      time: post.time,
      content: post.content,
      imageUrl: post.image_url,
      platform: post.platforms || [],
      status: post.status,
      isLive: post.is_live,
      category: post.category,
      campaignId: post.campaign_id,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    })) || [];

    res.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled posts' });
  }
});

/**
 * Create a new scheduled post
 */
router.post('/schedule/posts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const postData = req.body;

    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        campaign_id: postData.campaignId,
        date: postData.date,
        time: postData.time,
        content: postData.content,
        image_url: postData.imageUrl,
        platforms: postData.platform,
        category: postData.category,
        status: postData.status || 'scheduled',
        is_live: Boolean(postData.isLive)
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Transform back to client format
    const transformedPost = {
      id: data.id,
      date: data.date,
      time: data.time,
      content: data.content,
      imageUrl: data.image_url,
      platform: data.platforms || [],
      status: data.status,
      isLive: data.is_live,
      category: data.category,
      campaignId: data.campaign_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    res.json(transformedPost);
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    res.status(500).json({ error: 'Failed to create scheduled post' });
  }
});

/**
 * Update a scheduled post
 */
router.patch('/schedule/posts/:postId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({
        date: updates.date,
        time: updates.time,
        content: updates.content,
        image_url: updates.imageUrl,
        platforms: updates.platform,
        category: updates.category,
        status: updates.status,
        is_live: updates.isLive,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const transformedPost = {
      id: data.id,
      date: data.date,
      time: data.time,
      content: data.content,
      imageUrl: data.image_url,
      platform: data.platforms || [],
      status: data.status,
      isLive: data.is_live,
      category: data.category,
      campaignId: data.campaign_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    res.json(transformedPost);
  } catch (error) {
    console.error('Error updating scheduled post:', error);
    res.status(500).json({ error: 'Failed to update scheduled post' });
  }
});

/**
 * Delete a scheduled post
 */
router.delete('/schedule/posts/:postId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    res.status(500).json({ error: 'Failed to delete scheduled post' });
  }
});

/**
 * Get scheduling analytics
 */
router.get('/schedule/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { campaignId, period = 'month' } = req.query;

    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      default: // month
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get all posts for analytics
    const { data: allPosts, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('created_at', startDate.toISOString());

    if (error) {
      throw error;
    }

    // Calculate analytics
    const totalScheduled = allPosts?.filter(p => p.status === 'scheduled').length || 0;
    const totalPublished = allPosts?.filter(p => p.status === 'published').length || 0;
    const totalFailed = allPosts?.filter(p => p.status === 'failed').length || 0;

    // Posts by platform
    const postsByPlatform: Record<string, number> = {};
    allPosts?.forEach(post => {
      const platforms = post.platforms || [];
      platforms.forEach((platform: string) => {
        postsByPlatform[platform] = (postsByPlatform[platform] || 0) + 1;
      });
    });

    // Posts by category
    const postsByCategory: Record<string, number> = {};
    allPosts?.forEach(post => {
      const category = post.category || 'General';
      postsByCategory[category] = (postsByCategory[category] || 0) + 1;
    });

    // Upcoming posts (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const upcomingPosts = allPosts?.filter(post => {
      const postDate = new Date(post.date);
      return postDate >= now && postDate <= nextWeek && post.status === 'scheduled';
    }).map(post => ({
      id: post.id,
      date: post.date,
      time: post.time,
      content: post.content,
      imageUrl: post.image_url,
      platform: post.platforms || [],
      status: post.status,
      isLive: post.is_live,
      category: post.category,
      campaignId: post.campaign_id,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    })) || [];

    // Recent activity (last 30 posts)
    const recentActivity = allPosts?.slice(0, 30).map(post => ({
      id: post.id,
      date: post.date,
      time: post.time,
      content: post.content,
      imageUrl: post.image_url,
      platform: post.platforms || [],
      status: post.status,
      isLive: post.is_live,
      category: post.category,
      campaignId: post.campaign_id,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    })) || [];

    res.json({
      totalScheduled,
      totalPublished,
      totalFailed,
      postsByPlatform,
      postsByCategory,
      upcomingPosts,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * Generate live content for a specific date
 */
router.post('/ai/generate-live-content', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { campaignId, date, category, preferredModel } = req.body;

    if (!campaignId || !date) {
      return res.status(400).json({ error: 'Campaign ID and date are required' });
    }

    // Get campaign data
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // Create contextual AI prompt for live content
    const today = new Date().toDateString();
    const isToday = new Date(date).toDateString() === today;

    const aiPrompt = `
Generate live, contextual social media content for ${date}. This content should be relevant to current events, trends, or date-specific topics.

Campaign Context:
${campaignData ? `
Name: ${campaignData.name}
Industry: ${campaignData.industry || 'Technology'}
Description: ${campaignData.description || ''}
Target Audience: ${campaignData.target_audience || 'Professionals'}
` : 'No campaign data available'}

Requirements:
- Content category: ${category || 'General'}
- Date context: ${date} ${isToday ? '(TODAY)' : ''}
- Consider: current events, seasonal topics, industry trends, holidays, or special dates
- Make it timely and relevant
- Include appropriate hashtags
- Keep it engaging and professional

Generate 1-3 pieces of content as a JSON array with this structure:
[
  {
    "id": "unique-id",
    "date": "${date}",
    "time": "09:00",
    "content": "Contextual post content here",
    "imagePrompt": "AI image prompt if needed",
    "platform": ["linkedin"],
    "category": "${category || 'Live'}",
    "isLive": true,
    "reasoning": "Why this content is relevant for this date"
  }
]
    `;

    // Determine which AI model to use for live content
    const selectedModel = preferredModel || process.env.DEFAULT_SCHEDULING_MODEL || 'gpt-4-turbo';
    console.log('Using AI model for live content:', selectedModel);

    // Generate using the selected AI model
    const text = await generateAIText(aiPrompt, selectedModel);

    // Parse the JSON response
    let liveContent: any[];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        liveContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse live content response:', text);
      return res.status(500).json({ error: 'Failed to parse AI-generated live content' });
    }

    // Enhance the content
    const enhancedContent: GeneratedSchedule[] = liveContent.map((item, index) => ({
      id: item.id || `live_${Date.now()}_${index}`,
      date: item.date,
      time: item.time,
      content: item.content,
      imagePrompt: item.imagePrompt,
      platform: item.platform || ['linkedin'],
      category: item.category,
      isLive: true,
      reasoning: item.reasoning,
      campaignId
    }));

    res.json(enhancedContent);
  } catch (error) {
    console.error('Error generating live content:', error);
    res.status(500).json({ error: 'Failed to generate live content' });
  }
});

/**
 * Publish a scheduled post immediately
 */
router.post('/schedule/posts/:postId/publish', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    // Get the post details
    const { data: post, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Here you would implement the actual publishing logic
    // For now, we'll just update the status
    const { error: updateError } = await supabase
      .from('scheduled_posts')
      .update({
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (updateError) {
      throw updateError;
    }

    // In a real implementation, you would:
    // 1. Use the social media APIs to actually post
    // 2. Return the URLs of published posts
    // 3. Handle any publishing errors

    res.json({
      success: true,
      publishedUrls: [`https://linkedin.com/posts/${postId}`] // Mock URL
    });
  } catch (error) {
    console.error('Error publishing post:', error);
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

export default router;