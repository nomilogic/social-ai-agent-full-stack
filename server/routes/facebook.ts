import express, { Request, Response } from 'express'
import axios from 'axios'

const router = express.Router()

// GET /api/facebook/pages - Get user's Facebook pages
router.get('/pages', async (req: Request, res: Response) => {
  const accessToken = req.query.access_token as string

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' })
  }

  try {
    const response = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token,category,picture'
      }
    })

    res.json({
      success: true,
      pages: response.data.data
    })
  } catch (error: any) {
    console.error('Error fetching Facebook pages:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to fetch Facebook pages',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/facebook/post - Create Facebook post
router.post('/post', async (req: Request, res: Response) => {
  const { accessToken, post, pageId } = req.body

  if (!accessToken || !post) {
    return res.status(400).json({ error: 'Missing accessToken or post data' })
  }

  try {
    const targetId = pageId || 'me' // Post to page if pageId provided, otherwise to user's profile
    const url = `https://graph.facebook.com/v19.0/${targetId}/feed`

    const postData: any = {
      message: `${post.caption}\n${post.hashtags ? post.hashtags.join(' ') : ''}`,
      access_token: accessToken
    }

    // Add image if provided
    if (post.imageUrl) {
      postData.picture = post.imageUrl
    }

    const response = await axios.post(url, postData)

    res.json({
      success: true,
      data: response.data,
      platform: 'facebook',
      postId: response.data.id
    })

  } catch (error: any) {
    console.error('Facebook post error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to create Facebook post',
      details: error.response?.data || error.message
    })
  }
})

// GET /api/facebook/me - Get Facebook profile
router.get('/me', async (req: Request, res: Response) => {
  const accessToken = req.query.access_token as string

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' })
  }

  try {
    const response = await axios.get('https://graph.facebook.com/v19.0/me', {
      params: {
        access_token: accessToken,
        fields: 'id,name,email,picture'
      }
    })

    res.json(response.data)
  } catch (error: any) {
    console.error('Error fetching Facebook profile:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to fetch Facebook profile',
      details: error.response?.data || error.message
    })
  }
})

export default router
