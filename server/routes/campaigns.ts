import express, { Request, Response } from 'express'
import { db } from '../db'
import { campaigns, companies } from '../../shared/schema'
import { eq, and, desc } from 'drizzle-orm'
import { validateRequestBody } from '../middleware/auth'

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

    let whereCondition = eq(campaigns.company_id, companyId as string);
    
    if (status) {
      whereCondition = and(whereCondition, eq(campaigns.status, status as string));
    }

    const data = await db
      .select({
        id: campaigns.id,
        company_id: campaigns.company_id,
        name: campaigns.name,
        description: campaigns.description,
        objective: campaigns.objective,
        start_date: campaigns.start_date,
        end_date: campaigns.end_date,
        target_audience: campaigns.target_audience,
        platforms: campaigns.platforms,
        budget: campaigns.budget,
        status: campaigns.status,
        brand_voice: campaigns.brand_voice,
        keywords: campaigns.keywords,
        hashtags: campaigns.hashtags,
        created_at: campaigns.created_at,
        updated_at: campaigns.updated_at,
        companies: {
          name: companies.name,
          industry: companies.industry
        }
      })
      .from(campaigns)
      .leftJoin(companies, eq(campaigns.company_id, companies.id))
      .where(whereCondition)
      .orderBy(desc(campaigns.created_at));

    res.json(data);
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

    const data = await db
      .select({
        id: campaigns.id,
        company_id: campaigns.company_id,
        name: campaigns.name,
        description: campaigns.description,
        objective: campaigns.objective,
        start_date: campaigns.start_date,
        end_date: campaigns.end_date,
        target_audience: campaigns.target_audience,
        platforms: campaigns.platforms,
        budget: campaigns.budget,
        status: campaigns.status,
        brand_voice: campaigns.brand_voice,
        keywords: campaigns.keywords,
        hashtags: campaigns.hashtags,
        created_at: campaigns.created_at,
        updated_at: campaigns.updated_at,
        companies: {
          name: companies.name,
          industry: companies.industry,
          target_audience: companies.target_audience,
          brand_tone: companies.brand_tone
        }
      })
      .from(campaigns)
      .leftJoin(companies, eq(campaigns.company_id, companies.id))
      .where(eq(campaigns.id, id))
      .limit(1);

    if (data.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(data[0]);
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

    const [data] = await db
      .insert(campaigns)
      .values(dbCampaign)
      .returning();

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

    const [data] = await db
      .update(campaigns)
      .set({
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
      .where(eq(campaigns.id, id))
      .returning();

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

    await db
      .delete(campaigns)
      .where(eq(campaigns.id, id));

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

    // TODO: Implement campaign analytics with proper schema
    const data = {
      id,
      impressions: 0,
      clicks: 0,
      engagement_rate: 0
    };

    // Get posts data for analytics calculation
    const postsData = await db
      .select({
        status: campaigns.status,
        platforms: campaigns.platforms,
        created_at: campaigns.created_at
      })
      .from(campaigns)
      .where(eq(campaigns.id, id));

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

    const [data] = await db
      .update(campaigns)
      .set({ 
        status,
        updated_at: new Date().toISOString()
      })
      .where(eq(campaigns.id, id))
      .returning();

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

    // TODO: Implement scheduled_posts table and queries
    const transformedPosts: any[] = [];
    
    res.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching campaign posts:', error);
    res.status(500).json({ error: 'Failed to fetch campaign posts' });
  }
});

export default router;
import express, { Request, Response } from 'express'
import { db } from '../db'
import { campaigns } from '../../shared/schema'
import { eq, and, desc } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

const router = express.Router()

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

// GET /api/campaigns - Get all campaigns for a company
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const { companyId, userId } = req.query

  if (!companyId || !userId) {
    return res.status(400).json({ error: 'Company ID and User ID are required' })
  }

  try {
    console.log('Fetching campaigns for companyId:', companyId, 'userId:', userId)
    const data = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.company_id, companyId as string), eq(campaigns.user_id, userId as string)))
      .orderBy(desc(campaigns.created_at))

    console.log('Found campaigns:', data.length)
    res.json({ success: true, data: data || [] })
  } catch (err: any) {
    console.error('Server error fetching campaigns:', err)
    res.status(500).json({ error: 'Internal server error', details: err.message })
  }
})

// POST /api/campaigns - Create a new campaign
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const {
    name,
    description,
    objective,
    budget,
    startDate,
    endDate,
    targetAudience,
    platforms,
    keywords,
    companyId,
    userId
  } = req.body

  if (!name || !companyId || !userId) {
    return res.status(400).json({ error: 'Name, company ID, and user ID are required' })
  }

  try {
    console.log('Creating campaign with data:', {
      name,
      description,
      objective,
      budget,
      startDate,
      endDate,
      targetAudience,
      platforms,
      keywords,
      companyId,
      userId
    });

    const insertResults = await db
      .insert(campaigns)
      .values({
        name,
        description: description || null,
        objective: objective || 'engagement',
        budget: budget || null,
        start_date: startDate ? new Date(startDate) : null,
        end_date: endDate ? new Date(endDate) : null,
        target_audience: targetAudience || null,
        platforms: platforms || [],
        keywords: keywords || [],
        company_id: companyId,
        user_id: userId,
        status: 'draft'
      })
      .returning()

    const data = insertResults[0];
    console.log('Campaign created successfully:', data.id);

    res.status(201).json({ success: true, data })
  } catch (err: any) {
    console.error('Server error creating campaign:', err)
    res.status(500).json({ error: 'Internal server error', details: err.message })
  }
})

// PUT /api/campaigns/:id - Update a campaign
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const campaignId = req.params.id
  const {
    name,
    description,
    objective,
    budget,
    startDate,
    endDate,
    targetAudience,
    platforms,
    keywords,
    status,
    userId
  } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    console.log('Updating campaign:', campaignId, 'for user:', userId);

    const updateResults = await db
      .update(campaigns)
      .set({
        name,
        description,
        objective,
        budget,
        start_date: startDate ? new Date(startDate) : null,
        end_date: endDate ? new Date(endDate) : null,
        target_audience: targetAudience,
        platforms,
        keywords,
        status,
        updated_at: new Date()
      })
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.user_id, userId)))
      .returning()

    if (updateResults.length === 0) {
      return res.status(404).json({ error: 'Campaign not found or unauthorized' })
    }

    const data = updateResults[0];
    console.log('Campaign updated successfully:', data.id);

    res.json({ success: true, data })
  } catch (err: any) {
    console.error('Server error updating campaign:', err)
    res.status(500).json({ error: 'Internal server error', details: err.message })
  }
})

// DELETE /api/campaigns/:id - Delete a campaign
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  const campaignId = req.params.id
  const userId = req.query.userId as string

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    const result = await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.user_id, userId)))
      .returning({ id: campaigns.id })

    if (result.length === 0) {
      return res.status(404).json({ error: 'Campaign not found or unauthorized' })
    }

    res.json({ success: true, message: 'Campaign deleted successfully' })
  } catch (err: any) {
    console.error('Server error deleting campaign:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
