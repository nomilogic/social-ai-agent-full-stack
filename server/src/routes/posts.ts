import express, { Request, Response } from 'express'
import { serverSupabase } from '../supabaseClient'
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
    let query = serverSupabase
      .from('posts')
      .select(`
        *,
        companies (
          name,
          brand_tone
        )
      `)
      .eq('user_id', userId)

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      return res.status(500).json({ error: error.message })
    }

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
    const { data, error } = await serverSupabase
      .from('posts')
      .insert({
        company_id: companyId,
        prompt: prompt || '',
        tags: tags || [],
        campaign_id: campaignId || null,
        generated_content: generatedContent || [],
        user_id: userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return res.status(500).json({ error: error.message })
    }

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
    const { data, error } = await serverSupabase
      .from('posts')
      .update({
        prompt,
        tags,
        campaign_id: campaignId,
        generated_content: generatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('user_id', userId) // Ensure user owns this post
      .select()
      .single()

    if (error) {
      console.error('Error updating post:', error)
      return res.status(500).json({ error: error.message })
    }

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
    const { error } = await serverSupabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId) // Ensure user owns this post

    if (error) {
      console.error('Error deleting post:', error)
      return res.status(500).json({ error: error.message })
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
    const { data, error } = await serverSupabase
      .from('posts')
      .update({
        published_at: new Date().toISOString(),
        published_platforms: publishedPlatforms || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error marking post as published:', error)
      return res.status(500).json({ error: error.message })
    }

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
