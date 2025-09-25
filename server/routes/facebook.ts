import express, { Request, Response } from 'express'
import axios from 'axios'
import { db } from '../db'
import { oauth_tokens } from '../../shared/schema'
import { eq, and } from 'drizzle-orm'
import { deleteImageByUrl, downloadMediaFromStorage } from '../lib/supabaseStorage.js'
import { authenticateJWT } from '../middleware/auth'

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

  console.log('Facebook post request:', { 
    hasAccessToken: !!accessToken, 
    hasPost: !!post, 
    pageId, 
    caption: post?.caption?.substring(0, 50) + '...', 
    hasImage: !!post?.imageUrl 
  })

  try {
    // First, try to get user permissions to determine what we can do
    let targetId = 'me' // Default to user profile
    let finalAccessToken = accessToken
    
    // If pageId is provided, try to get page access token
    if (pageId && pageId !== 'me') {
      try {
        console.log('Fetching page token for pageId:', pageId)
        const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
          params: {
            access_token: accessToken,
            fields: 'id,name,access_token,category,permissions,tasks'
          }
        })
        
        console.log('Available pages:', pagesResponse.data.data?.map((p: any) => ({ id: p.id, name: p.name, hasToken: !!p.access_token })))
        
        const selectedPage = pagesResponse.data.data.find((page: any) => page.id === pageId)
        if (selectedPage && selectedPage.access_token) {
          targetId = pageId
          finalAccessToken = selectedPage.access_token
          console.log(`Using page token for page: ${selectedPage.name}`)
          
          // Verify page permissions for posting
          try {
            const permissionsResponse = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
              params: {
                access_token: selectedPage.access_token,
                fields: 'id,name,can_post,tasks'
              }
            })
            
            console.log('Page permissions verified:', permissionsResponse.data)
          } catch (permError) {
            console.warn('Could not verify page permissions:', permError.response?.data)
          }
        } else {
          console.log('Page not found or no access token available. Available pages:', pagesResponse.data.data?.length || 0)
          // Fallback to user profile posting
          console.log('Falling back to user profile posting')
        }
      } catch (pageError: any) {
        console.warn('Could not fetch page token:', pageError.response?.data || pageError.message)
        console.log('Falling back to user profile posting')
      }
    }
    
    // Prepare common message
    const message = `${post.caption}${post.hashtags && post.hashtags.length > 0 ? '\n\n' + post.hashtags.join(' ') : ''}`

    // Handle media properly - support both images and videos, Supabase URLs and convert relative URLs to absolute
    let resolvedMediaUrl: string | null = null
    let isVideo = false
    const mediaUrl = post.imageUrl || post.videoUrl // Support both imageUrl and videoUrl
    
    if (mediaUrl) {
      resolvedMediaUrl = mediaUrl
      
      // Determine if this is a video based on URL or file extension
      isVideo = resolvedMediaUrl.includes('.mp4') || 
                resolvedMediaUrl.includes('.webm') || 
                resolvedMediaUrl.includes('.mov') ||
                resolvedMediaUrl.includes('video/') ||
                (post.videoUrl && post.videoUrl === mediaUrl)
      
      // Handle Supabase storage URLs - they're already absolute
      if (resolvedMediaUrl.includes('supabase.co/storage/v1/object/public/')) {
        console.log(`Using Supabase hosted ${isVideo ? 'video' : 'image'}:`, resolvedMediaUrl)
      }
      // Handle Pollinations AI URLs - they're already absolute
      else if (resolvedMediaUrl.includes('image.pollinations.ai')) {
        console.log('Using Pollinations AI image:', resolvedMediaUrl)
      }
      // Convert relative URL to absolute if needed
      else if (resolvedMediaUrl.startsWith('/uploads/')) {
      const baseUrl =  process.env.BASE_URL || 'http://localhost:5000'
        resolvedMediaUrl = `${baseUrl}${resolvedMediaUrl}`
        console.log(`Resolved relative ${isVideo ? 'video' : 'image'} URL:`, resolvedMediaUrl)
      }
      // Other absolute URLs are used as-is
      else {
        console.log(`Using external ${isVideo ? 'video' : 'image'} URL:`, resolvedMediaUrl)
      }
    }

    // Decide endpoint based on whether we have media
    let url = `https://graph.facebook.com/v19.0/${targetId}/feed`
    let postData: any = { access_token: finalAccessToken }

    if (resolvedMediaUrl) {
      if (isVideo) {
        // For videos, try video endpoint first, but have fallback options
        url = `https://graph.facebook.com/v19.0/${targetId}/videos`
        
        // Try to use file_url first (requires video publishing permissions)
        postData = {
          file_url: resolvedMediaUrl,
          description: message,
          access_token: finalAccessToken
        }
        console.log('Posting video to URL:', url)
        console.log('Note: Video posting requires special Facebook permissions. If this fails, we\'ll fall back to link sharing.')
      } else {
        // Use photos endpoint for images
        url = `https://graph.facebook.com/v19.0/${targetId}/photos`
        postData = {
          url: resolvedMediaUrl,
          caption: message,
          access_token: finalAccessToken
        }
        console.log('Posting photo to URL:', url)
      }
    } else {
      // Text-only post
      postData = {
        message,
        access_token: finalAccessToken
      }
      console.log('Posting feed (text) to URL:', url)
    }

    let response
    
    try {
      response = await axios.post(url, postData)
    } catch (videoError: any) {
      // If video posting failed due to permissions, fall back to link sharing
      if (isVideo && resolvedMediaUrl && videoError.response?.data?.error?.code === 100) {
        console.log('Video posting failed due to permissions. Falling back to link sharing...')
        
        // Fall back to sharing the video as a link in a text post
        url = `https://graph.facebook.com/v19.0/${targetId}/feed`
        postData = {
          message: `${message}\n\n🎥 Video: ${resolvedMediaUrl}`,
          link: resolvedMediaUrl,
          access_token: finalAccessToken
        }
        
        console.log('Attempting video link sharing fallback...')
        response = await axios.post(url, postData)
        console.log('Successfully posted video as link share')
      } else {
        // Re-throw other errors
        throw videoError
      }
    }

    // Construct proper Facebook post URL
    let postUrl = '';
    if (response.data.id) {
      const postId = response.data.id;
      if (postId.includes('_')) {
        // Format: pageId_postId -> https://www.facebook.com/pageId/posts/postId
        const [pageId, actualPostId] = postId.split('_');
        postUrl = `https://www.facebook.com/${pageId}/posts/${actualPostId}`;
      } else {
        // Single ID format -> https://www.facebook.com/postId
        postUrl = `https://www.facebook.com/${postId}`;
      }
    }

    // NOTE: Don't clean up media here - other platforms may need it!
    // Media cleanup should happen after ALL platforms have posted
    console.log('ℹ️ Skipping media cleanup - other platforms may need this file')

    // Standardize response format to match other platforms
    res.json({
      success: true,
      platform: 'facebook',
      data: response.data,
      postId: response.data.id,
      postUrl,
      message: 'Successfully posted to Facebook',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Facebook post error:', error.response?.data || error.message)
    
    // Enhanced error handling with specific Facebook error codes
    const errorData = error.response?.data
    let errorMessage = 'Failed to create Facebook post'
    let statusCode = 500
    
    if (errorData?.error) {
      const fbError = errorData.error
      
      // Handle specific Facebook error codes
      switch (fbError.code) {
        case 190:
          errorMessage = 'Facebook access token expired or invalid. Please reconnect your account.'
          statusCode = 401
          break
        case 100:
          errorMessage = 'Invalid Facebook API request. Please check your post content.'
          statusCode = 400
          break
        case 200:
          errorMessage = 'Facebook permissions error. Please ensure you have proper posting permissions.'
          statusCode = 403
          break
        case 368:
          errorMessage = 'Facebook posting temporarily blocked due to suspicious activity.'
          statusCode = 429
          break
        default:
          errorMessage = fbError.message || 'Facebook API error'
          statusCode = error.response?.status || 500
      }
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: errorData || error.message,
      platform: 'facebook',
      retryable: statusCode >= 500 || statusCode === 429
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

// GET /api/facebook/oauth_tokens - Get Facebook OAuth tokens for authenticated user
router.get('/oauth_tokens', authenticateJWT, async (req: Request, res: Response) => {
  const userId = req.user!.id; // Extract from authenticated JWT token
  
  try {
    console.log(`Fetching Facebook tokens for user: ${userId}`)
    
    const tokens = await db
      .select()
      .from(oauth_tokens)
      .where(and(
        eq(oauth_tokens.user_id, userId),
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
