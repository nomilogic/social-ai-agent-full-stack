import express, { Request, Response } from 'express'
import axios from 'axios'
import { db } from '../db'
import { oauth_tokens } from '../../shared/schema'
import { eq, and } from 'drizzle-orm'

const router = express.Router()

// GET /api/instagram/business-accounts - Get Instagram business accounts linked to Facebook pages
router.get('/business-accounts', async (req: Request, res: Response) => {
  const accessToken = req.query.access_token as string

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' })
  }

  try {
    // First get Facebook pages
    const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token'
      }
    })

    const businessAccounts = []

    // Check each page for linked Instagram business account
    for (const page of pagesResponse.data.data) {
      try {
        const igResponse = await axios.get(`https://graph.facebook.com/v19.0/${page.id}`, {
          params: {
            access_token: page.access_token,
            fields: 'instagram_business_account'
          }
        })

        if (igResponse.data.instagram_business_account) {
          // Get Instagram account details
          const igAccountResponse = await axios.get(`https://graph.facebook.com/v19.0/${igResponse.data.instagram_business_account.id}`, {
            params: {
              access_token: page.access_token,
              fields: 'id,username,name,profile_picture_url,followers_count'
            }
          })

          businessAccounts.push({
            ...igAccountResponse.data,
            page_id: page.id,
            page_name: page.name,
            page_access_token: page.access_token
          })
        }
      } catch (error) {
        console.log(`No Instagram account for page ${page.name}`)
      }
    }

    res.json({
      success: true,
      accounts: businessAccounts
    })
  } catch (error: any) {
    console.error('Error fetching Instagram business accounts:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to fetch Instagram business accounts',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/instagram/post - Create Instagram post
router.post('/post', async (req: Request, res: Response) => {
  const { accessToken, post, businessAccountId, pageAccessToken } = req.body

  if (!accessToken || !post || !businessAccountId) {
    return res.status(400).json({ 
      error: 'Missing required fields: accessToken, post, and businessAccountId are required' 
    })
  }

  if (!post.imageUrl) {
    return res.status(400).json({ 
      error: 'Instagram posts require an image URL' 
    })
  }

  try {
    const token = pageAccessToken || accessToken

    // Step 1: Create media container
    const mediaResponse = await axios.post(`https://graph.facebook.com/v19.0/${businessAccountId}/media`, {
      image_url: post.imageUrl,
      caption: `${post.caption}\n${post.hashtags ? post.hashtags.join(' ') : ''}`,
      access_token: token
    })

    const mediaId = mediaResponse.data.id

    // Step 2: Publish the media container
    const publishResponse = await axios.post(`https://graph.facebook.com/v19.0/${businessAccountId}/media_publish`, {
      creation_id: mediaId,
      access_token: token
    })

    res.json({
      success: true,
      data: publishResponse.data,
      platform: 'instagram',
      postId: publishResponse.data.id,
      mediaId: mediaId
    })

  } catch (error: any) {
    console.error('Instagram post error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to create Instagram post',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/instagram/carousel - Create Instagram carousel post (multiple images)
router.post('/carousel', async (req: Request, res: Response) => {
  const { accessToken, post, businessAccountId, pageAccessToken, images } = req.body

  if (!accessToken || !post || !businessAccountId || !images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ 
      error: 'Missing required fields or images array is empty' 
    })
  }

  try {
    const token = pageAccessToken || accessToken
    const mediaIds = []

    // Step 1: Create media containers for each image
    for (const imageUrl of images) {
      const mediaResponse = await axios.post(`https://graph.facebook.com/v19.0/${businessAccountId}/media`, {
        image_url: imageUrl,
        is_carousel_item: true,
        access_token: token
      })
      mediaIds.push(mediaResponse.data.id)
    }

    // Step 2: Create carousel container
    const carouselResponse = await axios.post(`https://graph.facebook.com/v19.0/${businessAccountId}/media`, {
      media_type: 'CAROUSEL',
      children: mediaIds.join(','),
      caption: `${post.caption}\n${post.hashtags ? post.hashtags.join(' ') : ''}`,
      access_token: token
    })

    const carouselId = carouselResponse.data.id

    // Step 3: Publish the carousel
    const publishResponse = await axios.post(`https://graph.facebook.com/v19.0/${businessAccountId}/media_publish`, {
      creation_id: carouselId,
      access_token: token
    })

    res.json({
      success: true,
      data: publishResponse.data,
      platform: 'instagram',
      postId: publishResponse.data.id,
      mediaIds: mediaIds,
      carouselId: carouselId
    })

  } catch (error: any) {
    console.error('Instagram carousel post error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to create Instagram carousel post',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/instagram/access-token - Handle Instagram OAuth callback
router.post('/access-token', async (req: Request, res: Response) => {
  console.log('Received Instagram OAuth callback with body:', req.body)
  
  let body = req.body
  if (typeof body === 'string') {
    body = JSON.parse(body)
  }
  
  const { code, redirect_uri, user_id } = body
  
  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'Missing required parameters: code and redirect_uri' })
  }
  
  try {
    // Step 1: Get short-lived access token
    const response = await axios.post('https://api.instagram.com/oauth/access_token', 
      new URLSearchParams({
        client_id: process.env.VITE_FACEBOOK_CLIENT_ID || '', // Instagram uses Facebook App ID
        client_secret: process.env.VITE_FACEBOOK_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri,
        code: code
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    
    console.log('Instagram short-lived token response:', response.data)
    
    // Step 2: Exchange for long-lived token
    let tokenData = response.data
    if (tokenData.access_token) {
      try {
        const longLivedResponse = await axios.get('https://graph.instagram.com/access_token', {
          params: {
            grant_type: 'ig_exchange_token',
            client_secret: process.env.VITE_FACEBOOK_CLIENT_SECRET || '',
            access_token: tokenData.access_token
          }
        })
        
        if (longLivedResponse.data.access_token) {
          tokenData = longLivedResponse.data
          console.log('Instagram long-lived token obtained')
        }
      } catch (exchangeError) {
        console.warn('Failed to exchange for long-lived Instagram token:', exchangeError)
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
            eq(oauth_tokens.platform, 'instagram')
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
              eq(oauth_tokens.platform, 'instagram')
            ))
        } else {
          // Insert new token
          await db.insert(oauth_tokens).values({
            user_id: user_id,
            platform: 'instagram',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            expires_at: expires_at
          })
        }
        
        console.log(`Instagram token stored successfully for user ${user_id}`)
      } catch (storeError) {
        console.error('Failed to store Instagram token:', storeError)
        // Don't fail the request, but log the error
      }
    }
    
    res.json(tokenData)
  } catch (error: any) {
    console.error('Instagram token exchange error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to exchange Instagram authorization code for access token',
      details: error.response?.data || error.message
    })
  }
})

// GET /api/instagram/oauth_tokens - Get Instagram OAuth tokens for a user
router.get('/oauth_tokens', async (req: Request, res: Response) => {
  const { user_id } = req.query
  
  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'user_id parameter is required' })
  }
  
  try {
    console.log(`Fetching Instagram tokens for user: ${user_id}`)
    
    const tokens = await db
      .select()
      .from(oauth_tokens)
      .where(and(
        eq(oauth_tokens.user_id, user_id),
        eq(oauth_tokens.platform, 'instagram')
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
    console.error('Failed to fetch Instagram tokens:', error)
    res.status(500).json({ error: 'Failed to fetch Instagram tokens' })
  }
})

export default router
