import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Initialize services
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

interface ScheduleRequest {
  prompt: string;
  category?: string;
  platforms: string[];
  timePreference?: 'morning' | 'afternoon' | 'evening' | 'custom';
  customTime?: string;
  keywords?: string[];
  companyId: string;
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
  companyId: string;
}

/**
 * Generate AI-powered posting schedule
 */
router.post('/ai/generate-schedule', async (req: Request, res: Response) => {
  try {
    const request: ScheduleRequest = req.body;
    
    if (!request.prompt || !request.platforms || request.platforms.length === 0 || !request.companyId) {
      return res.status(400).json({ error: 'Missing required fields: prompt, platforms, and companyId are required' });
    }

    // Get company data for context
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('id', request.companyId)
      .single();

    // Create AI prompt for schedule generation
    const aiPrompt = `
You are an expert social media strategist. Generate a detailed posting schedule based on the following request:

Request: "${request.prompt}"
Platforms: ${request.platforms.join(', ')}
Category: ${request.category || 'General'}
Keywords: ${request.keywords?.join(', ') || 'None specified'}
Time Preference: ${request.timePreference || 'flexible'}
${request.customTime ? `Custom Time: ${request.customTime}` : ''}

Company Context:
${companyData ? `
Name: ${companyData.name}
Industry: ${companyData.industry || 'Technology'}
Description: ${companyData.description || ''}
Target Audience: ${companyData.target_audience || 'Professionals'}
` : 'No company data available'}

Based on the request, generate a posting schedule with the following requirements:

1. Parse the natural language request to determine:
   - Frequency (daily, weekly, specific days)
   - Duration (how long the schedule should run)
   - Content themes and topics

2. For each scheduled post, provide:
   - Exact date (YYYY-MM-DD format)
   - Time (HH:MM format, 24-hour)
   - Engaging content (150-280 characters depending on platform)
   - Image prompt for AI image generation (if applicable)
   - Brief reasoning for the timing and content choice
   - Whether it should be "live" content (generated on the day based on current events)

3. Guidelines:
   - Vary content to avoid repetition
   - Consider optimal posting times for each platform
   - Include relevant hashtags and mentions where appropriate
   - Make content engaging and platform-specific
   - For "live" posts, focus on topics that would benefit from real-time context

4. Return the schedule as a JSON array with this exact structure:
[
  {
    "id": "unique-id-string",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "content": "Post content here with hashtags and mentions",
    "imagePrompt": "Detailed prompt for AI image generation (optional)",
    "platform": ["platform1", "platform2"],
    "category": "category-name",
    "isLive": false,
    "reasoning": "Brief explanation of timing and content choice"
  }
]

Generate a comprehensive schedule that matches the user's request. Be creative but professional.
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response from AI
    let scheduleData: any[];
    try {
      // Extract JSON from the response (AI might include additional text)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        scheduleData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return res.status(500).json({ error: 'Failed to parse AI-generated schedule' });
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
      companyId: request.companyId
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
router.post('/schedule/save', async (req: Request, res: Response) => {
  try {
    const { schedule }: { schedule: GeneratedSchedule[] } = req.body;

    if (!schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ error: 'Invalid schedule data' });
    }

    // Prepare data for database insertion
    const scheduledPosts = schedule.map(item => ({
      id: item.id,
      company_id: item.companyId,
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
 * Get scheduled posts for a company
 */
router.get('/schedule/posts', async (req: Request, res: Response) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .eq('company_id', companyId)
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
      companyId: post.company_id,
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
router.post('/schedule/posts', async (req: Request, res: Response) => {
  try {
    const postData = req.body;

    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        company_id: postData.companyId,
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
      companyId: data.company_id,
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
router.patch('/schedule/posts/:postId', async (req: Request, res: Response) => {
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
      companyId: data.company_id,
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
router.delete('/schedule/posts/:postId', async (req: Request, res: Response) => {
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
router.get('/schedule/analytics', async (req: Request, res: Response) => {
  try {
    const { companyId, period = 'month' } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
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
      .eq('company_id', companyId)
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
      companyId: post.company_id,
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
      companyId: post.company_id,
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
router.post('/ai/generate-live-content', async (req: Request, res: Response) => {
  try {
    const { companyId, date, category } = req.body;

    if (!companyId || !date) {
      return res.status(400).json({ error: 'Company ID and date are required' });
    }

    // Get company data
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    // Create contextual AI prompt for live content
    const today = new Date().toDateString();
    const isToday = new Date(date).toDateString() === today;

    const aiPrompt = `
Generate live, contextual social media content for ${date}. This content should be relevant to current events, trends, or date-specific topics.

Company Context:
${companyData ? `
Name: ${companyData.name}
Industry: ${companyData.industry || 'Technology'}
Description: ${companyData.description || ''}
Target Audience: ${companyData.target_audience || 'Professionals'}
` : 'No company data available'}

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

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const text = response.text();

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
      companyId
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
router.post('/schedule/posts/:postId/publish', async (req: Request, res: Response) => {
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
