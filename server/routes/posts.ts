import express, { Request, Response } from 'express'
import { db } from '../db'
import { posts, companies } from '../../shared/schema'
import { eq, and, desc } from 'drizzle-orm'
import { validateRequestBody } from '../middleware/auth'

const router = express.Router()

// GET /api/posts - Get all posts for a user (optionally filtered by company)
router.get('/', async (req: Request, res: Response) => {
  const userId = req.query.userId as string
  const companyId = req.query.companyId as string

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    let whereCondition = eq(posts.user_id, userId)
    
    if (companyId) {
      whereCondition = and(eq(posts.user_id, userId), eq(posts.company_id, companyId))
    }

    const data = await db
      .select({
        id: posts.id,
        company_id: posts.company_id,
        prompt: posts.prompt,
        tags: posts.tags,
        campaign_id: posts.campaign_id,
        media_url: posts.media_url,
        generated_content: posts.generated_content,
        user_id: posts.user_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
        company_name: companies.name,
        company_brand_tone: companies.brand_tone
      })
      .from(posts)
      .leftJoin(companies, eq(posts.company_id, companies.id))
      .where(whereCondition)
      .orderBy(desc(posts.created_at))

    res.json({ success: true, data })
  } catch (err: any) {
    console.error('Server error fetching posts:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/posts - Create a new post
router.post('/', validateRequestBody(['companyId', 'userId']), async (req: Request, res: Response) => {
  const {
    companyId,
    prompt,
    tags,
    campaignId,
    generatedContent,
    userId
  } = req.body

  try {
    const [data] = await db
      .insert(posts)
      .values({
        company_id: companyId,
        prompt: prompt || '',
        tags: tags || [],
        campaign_id: campaignId || null,
        generated_content: generatedContent || null,
        user_id: userId
      })
      .returning()

    res.status(201).json({ success: true, data })
  } catch (err: any) {
    console.error('Server error creating post:', err)
    res.status(500).json({ error: 'Internal server error' })
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
