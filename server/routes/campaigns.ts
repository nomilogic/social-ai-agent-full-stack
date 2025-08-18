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

// GET /api/campaigns - Get all campaigns for a user
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.query.userId as string

  if (!userId) {
    console.log('No userId provided in campaigns request')
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    console.log('Fetching campaigns for userId:', userId)
    const data = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.user_id, userId))
      .orderBy(desc(campaigns.created_at))

    console.log('Found campaigns:', data.length)
    res.json({ success: true, data: data || [] })
  } catch (err: any) {
    console.error('Server error fetching campaigns:', err)
    console.error('Error details:', err.message, err.stack)
    res.status(500).json({ error: 'Internal server error', details: err.message })
  }
})

// POST /api/campaigns - Create a new campaign
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const {
    name,
    website,
    industry,
    description,
    targetAudience,
    brandTone,
    goals,
    platforms,
    userId,
    // Additional campaign fields
    objective,
    startDate,
    endDate,
    budget,
    status,
    keywords,
    hashtags
  } = req.body

  // Validate required fields
  if (!name || !userId) {
    return res.status(400).json({ 
      error: 'Campaign name and user ID are required' 
    });
  }

  if (!platforms || platforms.length === 0) {
    return res.status(400).json({ 
      error: 'At least one platform must be selected' 
    });
  }

  try {
    console.log('Creating campaign with data:', {
      name,
      website,
      industry,
      description,
      targetAudience,
      brandTone,
      goals,
      platforms,
      userId,
      objective,
      startDate,
      endDate,
      budget,
      status
    });

    const insertResults = await db
      .insert(campaigns)
      .values({
        name,
        website: website || null,
        industry: industry || null,
        description: description || null,
        target_audience: targetAudience || null,
        brand_tone: brandTone || 'professional',
        goals: goals || [],
        platforms: platforms || [],
        objective: objective || null,
        start_date: startDate || null,
        end_date: endDate || null,
        budget: budget || null,
        status: status || 'active',
        brand_voice: brandTone || 'professional', // alias for brand_tone
        keywords: keywords || [],
        hashtags: hashtags || [],
        total_posts: 0,
        published_posts: 0,
        scheduled_posts: 0,
        is_active: true,
        user_id: userId
      })
      .returning()

    const data = insertResults[0];
    console.log('Campaign created successfully:', data.id);

    res.status(201).json({ success: true, data })
  } catch (err: any) {
    console.error('Server error creating campaign:', err)
    console.error('Error details:', err.message, err.stack)
    res.status(500).json({ error: 'Internal server error', details: err.message })
  }
})

// PUT /api/campaigns/:id - Update a campaign
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const campaignId = req.params.id
  const {
    name,
    website,
    industry,
    description,
    targetAudience,
    brandTone,
    goals,
    platforms,
    userId,
    // Additional campaign fields
    objective,
    startDate,
    endDate,
    budget,
    status,
    keywords,
    hashtags
  } = req.body

  try {
    console.log('Updating campaign:', campaignId, 'for user:', userId);

    const updateResults = await db
      .update(campaigns)
      .set({
        name,
        website,
        industry,
        description,
        target_audience: targetAudience,
        brand_tone: brandTone,
        goals,
        platforms,
        objective,
        start_date: startDate,
        end_date: endDate,
        budget,
        status,
        brand_voice: brandTone, // alias for brand_tone
        keywords,
        hashtags,
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
    console.error('Error details:', err.message, err.stack)
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
