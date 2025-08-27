import express, { Request, Response } from 'express'
import { db } from '../db'
import { posts, campaigns } from '../../shared/schema'
import { eq, and, desc } from 'drizzle-orm'
import { validateRequestBody } from '../middleware/auth'

const router = express.Router()

// GET /api/posts - Get all posts for a user (optionally filtered by campaign)
router.get('/', async (req: Request, res: Response) => {
  const userId = req.query.userId as string
  const campaignId = req.query.campaignId as string

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    let whereCondition = eq(posts.user_id, userId)

    if (campaignId) {
      whereCondition = and(eq(posts.user_id, userId), eq(posts.campaign_id, campaignId))!
    }

    const data = await db
      .select({
        id: posts.id,
        campaign_id: posts.campaign_id,
        prompt: posts.prompt,
        tags: posts.tags,
        media_url: posts.media_url,
        generated_content: posts.generated_content,
        user_id: posts.user_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
        campaign_name: campaigns.name,
        campaign_brand_tone: campaigns.brand_tone
      })
      .from(posts)
      .leftJoin(campaigns, eq(posts.campaign_id, campaigns.id))
      .where(whereCondition)
      .orderBy(desc(posts.created_at))

    res.json({ success: true, data })
  } catch (err: any) {
    console.error('Server error fetching posts:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/posts - Create a new post
router.post('/', validateRequestBody(['userId']), async (req: Request, res: Response) => {
  const {
    campaignId,
    prompt,
    tags,
    generatedContent,
    userId
  } = req.body

  try {
    let finalCampaignId = campaignId;
    
    // If campaignId is provided, check if it exists
    if (campaignId) {
      const existingCampaign = await db
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1);
      
      if (existingCampaign.length === 0) {
        console.log('Campaign not found, creating default campaign for user:', userId);
        // Create a default campaign
        const [newCampaign] = await db
          .insert(campaigns)
          .values({
            user_id: userId,
            name: 'Default Campaign',
            description: 'Default campaign for posts',
            brand_tone: 'professional',
            goals: ['engagement'],
            platforms: ['linkedin']
          })
          .returning({ id: campaigns.id });
        
        finalCampaignId = newCampaign.id;
        console.log('Created default campaign:', finalCampaignId);
      }
    } else {
      // No campaignId provided, create or use default campaign
      console.log('No campaign ID provided, looking for default campaign for user:', userId);
      
      // Try to find existing default campaign
      const existingDefault = await db
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(and(eq(campaigns.user_id, userId), eq(campaigns.name, 'Default Campaign')))
        .limit(1);
      
      if (existingDefault.length > 0) {
        finalCampaignId = existingDefault[0].id;
        console.log('Using existing default campaign:', finalCampaignId);
      } else {
        // Create new default campaign
        const [newCampaign] = await db
          .insert(campaigns)
          .values({
            user_id: userId,
            name: 'Default Campaign',
            description: 'Default campaign for posts',
            brand_tone: 'professional',
            goals: ['engagement'],
            platforms: ['linkedin']
          })
          .returning({ id: campaigns.id });
        
        finalCampaignId = newCampaign.id;
        console.log('Created new default campaign:', finalCampaignId);
      }
    }

    const [data] = await db
      .insert(posts)
      .values({
        campaign_id: finalCampaignId,
        prompt: prompt || '',
        tags: tags || [],
        generated_content: generatedContent || null,
        user_id: userId
      })
      .returning()

    res.status(201).json({ success: true, data })
  } catch (err: any) {
    console.error('Server error creating post:', err)
    res.status(500).json({ error: 'Internal server error', details: err.message })
  }
})

// PUT /api/posts/:id - Update a post
router.put('/:id', validateRequestBody(['userId']), async (req: Request, res: Response) => {
  const postId = req.params.id
  const {
    prompt,
    tags,
    campaignId,
    generatedContent,
    userId
  } = req.body

  try {
    const [data] = await db
      .update(posts)
      .set({
        prompt,
        tags,
        campaign_id: campaignId,
        generated_content: generatedContent,
        updated_at: new Date()
      })
      .where(and(eq(posts.id, postId), eq(posts.user_id, userId)))
      .returning()

    if (!data) {
      return res.status(404).json({ error: 'Post not found or unauthorized' })
    }

    res.json({ success: true, data })
  } catch (err: any) {
    console.error('Server error updating post:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/posts/:id - Delete a post
router.delete('/:id', async (req: Request, res: Response) => {
  const postId = req.params.id
  const userId = req.query.userId as string

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    const result = await db
      .delete(posts)
      .where(and(eq(posts.id, postId), eq(posts.user_id, userId)))
      .returning({ id: posts.id })

    if (result.length === 0) {
      return res.status(404).json({ error: 'Post not found or unauthorized' })
    }

    res.json({ success: true, message: 'Post deleted successfully' })
  } catch (err: any) {
    console.error('Server error deleting post:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/posts/:id/publish - Mark a post as published
router.post('/:id/publish', validateRequestBody(['userId']), async (req: Request, res: Response) => {
  const postId = req.params.id
  const { userId, publishedPlatforms } = req.body

  try {
    const [data] = await db
      .update(posts)
      .set({
        updated_at: new Date()
      })
      .where(and(eq(posts.id, postId), eq(posts.user_id, userId)))
      .returning()

    if (!data) {
      return res.status(404).json({ error: 'Post not found or unauthorized' })
    }

    res.json({ success: true, data })
  } catch (err: any) {
    console.error('Server error publishing post:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router