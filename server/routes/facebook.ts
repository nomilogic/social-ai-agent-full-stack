import express, { Request, Response } from 'express'
import axios from 'axios'
import { db } from '../db'
import { oauth_tokens } from '../../shared/schema'
import { eq, and } from 'drizzle-orm'

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

// POST /api/facebook/access-token - Handle Facebook OAuth callback
router.post('/access-token', async (req: Request, res: Response) => {
  console.log('Received Facebook OAuth callback with body:', req.body)
  
  let body = req.body
  if (typeof body === 'string') {
    body = JSON.parse(body)
  }
  
  const { code, redirect_uri, user_id } = body
  
  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'Missing required parameters: code and redirect_uri' })
  }
  
  try {
    const response = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: process.env.VITE_FACEBOOK_CLIENT_ID || '',
        client_secret: process.env.VITE_FACEBOOK_CLIENT_SECRET || '',
        code: code,
        redirect_uri: redirect_uri
      }
    })
    
    console.log('Facebook access token response:', response.data)
    
    // Exchange for long-lived token
    let tokenData = response.data
    if (tokenData.access_token) {
      try {
        const longLivedResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: process.env.VITE_FACEBOOK_CLIENT_ID || '',
            client_secret: process.env.VITE_FACEBOOK_CLIENT_SECRET || '',
            fb_exchange_token: tokenData.access_token
          }
        })
        
        if (longLivedResponse.data.access_token) {
          tokenData = longLivedResponse.data
          console.log('Facebook long-lived token obtained')
        }
      } catch (exchangeError) {
        console.warn('Failed to exchange for long-lived token:', exchangeError)
      }
    }
    
    // Save token to database if user_id is provided
    if (user_id && tokenData.access_token) {
      try {
        // Calculate expiry date if expires_in is provided
        let expires_at: Date | null = null
        if (tokenData.expires_in) {
          expires_at = new Date(Date.now() + (tokenData.expires_in * 1000))
        }
        
        // Check if token already exists
        const existingToken = await db
          .select()
          .from(oauth_tokens)
          .where(and(
            eq(oauth_tokens.user_id, user_id),
            eq(oauth_tokens.platform, 'facebook')
          ))
          .limit(1)
        
        if (existingToken.length > 0) {
          // Update existing token
          await db
            .update(oauth_tokens)
            .set({
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token || null,
              expires_at: expires_at,
              updated_at: new Date()
            })
            .where(and(
              eq(oauth_tokens.user_id, user_id),
              eq(oauth_tokens.platform, 'facebook')
            ))
        } else {
          // Insert new token
          await db.insert(oauth_tokens).values({
            user_id: user_id,
            platform: 'facebook',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            expires_at: expires_at
          })
        }
        
        console.log(`Facebook token stored successfully for user ${user_id}`)
      } catch (storeError) {
        console.error('Failed to store Facebook token:', storeError)
        // Don't fail the request, but log the error
      }
    }
    
    res.json(tokenData)
  } catch (error: any) {
    console.error('Facebook token exchange error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to exchange Facebook authorization code for access token',
      details: error.response?.data || error.message
    })
  }
})

// GET /api/facebook/oauth_tokens - Get Facebook OAuth tokens for a user
router.get('/oauth_tokens', async (req: Request, res: Response) => {
  const { user_id } = req.query
  
  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'user_id parameter is required' })
  }
  
  try {
    console.log(`Fetching Facebook tokens for user: ${user_id}`)
    
    const tokens = await db
      .select()
      .from(oauth_tokens)
      .where(and(
        eq(oauth_tokens.user_id, user_id),
        eq(oauth_tokens.platform, 'facebook')
      ))
      .limit(1)
    
    if (tokens.length === 0) {
      return res.json({ connected: false, token: null })
    }
    
    const token = tokens[0]
    
    // Check if token is expired
    const isExpired = token.expires_at ? new Date(token.expires_at) < new Date() : false
    
    return res.json({
      connected: true,
      expired: isExpired,
      token: {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: token.expires_at,
        token_type: token.token_type
      }
    })
    
  } catch (error) {
    console.error('Failed to fetch Facebook tokens:', error)
    res.status(500).json({ error: 'Failed to fetch Facebook tokens' })
  }
})

export default router
