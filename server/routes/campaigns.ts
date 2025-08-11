import express, { Request, Response } from 'express';
import { serverSupabaseAnon as serverSupabase } from '../supabaseClient';
import { validateRequestBody } from '../middleware/auth';

const router = express.Router();

interface Campaign {
  id?: string;
  company_id: string;
  name: string;
  description?: string;
  objective?: string;
  start_date?: string;
  end_date?: string;
  target_audience?: string;
  platforms?: string[];
  budget?: number;
  status?: 'active' | 'paused' | 'completed' | 'draft';
  brand_voice?: string;
  keywords?: string[];
  hashtags?: string[];
}

/**
 * GET /api/campaigns - Get all campaigns for a company
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { companyId, status } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    let query = serverSupabase
      .from('campaigns')
      .select(`
        *,
        companies(name, industry)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * GET /api/campaigns/:id - Get a specific campaign
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await serverSupabase
      .from('campaigns')
      .select(`
        *,
        companies(name, industry, target_audience, brand_tone)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

/**
 * POST /api/campaigns - Create a new campaign
 */
router.post('/', validateRequestBody(['company_id', 'name']), async (req: Request, res: Response) => {
  try {
    const campaignData: Campaign = req.body;

    // Validate required fields
    if (!campaignData.company_id || !campaignData.name) {
      return res.status(400).json({ error: 'Company ID and campaign name are required' });
    }

    // Prepare data for database
    const dbCampaign = {
      company_id: campaignData.company_id,
      name: campaignData.name,
      description: campaignData.description,
      objective: campaignData.objective || 'awareness',
      start_date: campaignData.start_date,
      end_date: campaignData.end_date,
      target_audience: campaignData.target_audience,
      platforms: campaignData.platforms || [],
      budget: campaignData.budget,
      status: campaignData.status || 'active',
      brand_voice: campaignData.brand_voice,
      keywords: campaignData.keywords || [],
      hashtags: campaignData.hashtags || []
    };

    const { data, error } = await serverSupabase
      .from('campaigns')
      .insert(dbCampaign)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

/**
 * PUT /api/campaigns/:id - Update a campaign
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaignData: Partial<Campaign> = req.body;

    // Remove fields that shouldn't be updated directly
    delete campaignData.id;

    const { data, error } = await serverSupabase
      .from('campaigns')
      .update({
        name: campaignData.name,
        description: campaignData.description,
        objective: campaignData.objective,
        start_date: campaignData.start_date,
        end_date: campaignData.end_date,
        target_audience: campaignData.target_audience,
        platforms: campaignData.platforms,
        budget: campaignData.budget,
        status: campaignData.status,
        brand_voice: campaignData.brand_voice,
        keywords: campaignData.keywords,
        hashtags: campaignData.hashtags,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

/**
 * DELETE /api/campaigns/:id - Delete a campaign
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await serverSupabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

/**
 * GET /api/campaigns/:id/analytics - Get campaign analytics
 */
router.get('/:id/analytics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await serverSupabase
      .from('campaign_analytics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get additional analytics
    const { data: postsData } = await serverSupabase
      .from('scheduled_posts')
      .select(`
        status,
        platforms,
        created_at,
        date,
        is_live
      `)
      .eq('campaign_id', id);

    // Calculate platform breakdown
    const platformBreakdown: Record<string, number> = {};
    postsData?.forEach(post => {
      post.platforms?.forEach((platform: string) => {
        platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
      });
    });

    // Calculate posting frequency
    const postsByDate: Record<string, number> = {};
    postsData?.forEach(post => {
      const date = post.date;
      postsByDate[date] = (postsByDate[date] || 0) + 1;
    });

    const analytics = {
      ...data,
      platformBreakdown,
      postsByDate,
      livePostsCount: postsData?.filter(p => p.is_live).length || 0,
      averagePostsPerDay: Object.keys(postsByDate).length > 0 
        ? Object.values(postsByDate).reduce((a, b) => a + b, 0) / Object.keys(postsByDate).length 
        : 0
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

/**
 * PATCH /api/campaigns/:id/status - Update campaign status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'paused', 'completed', 'draft'].includes(status)) {
      return res.status(400).json({ 
        error: 'Valid status is required (active, paused, completed, draft)' 
      });
    }

    const { data, error } = await serverSupabase
      .from('campaigns')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating campaign status:', error);
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
});

/**
 * GET /api/campaigns/:id/posts - Get all posts for a campaign
 */
router.get('/:id/posts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = serverSupabase
      .from('scheduled_posts')
      .select('*')
      .eq('campaign_id', id)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform to client format
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
      companyId: post.company_id,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    })) || [];

    res.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching campaign posts:', error);
    res.status(500).json({ error: 'Failed to fetch campaign posts' });
  }
});

export default router;
