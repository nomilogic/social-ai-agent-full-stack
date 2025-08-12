import express, { Request, Response } from 'express'
import axios from 'axios'
import { db } from '../db'
import { oauth_tokens } from '../../shared/schema'
import { eq, and } from 'drizzle-orm'

const router = express.Router()

// Environment variables will be read inside route handlers to ensure dotenv has loaded them

// GET /api/oauth/linkedin - Initiate LinkedIn OAuth flow
router.get('/linkedin', (req: Request, res: Response) => {
  console.log("Received request for LinkedIn OAuth")
  const { user_id } = req.query
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' })
  }
  
  const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID as string
  const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET as string
  
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'LinkedIn OAuth not configured. Please add LINKEDIN_CLIENT_ID to environment variables.' })
  }

  const REDIRECT_URI = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/linkedin/callback`
  const state = Buffer.from(JSON.stringify({ user_id })).toString('base64')
  const scope = "profile%20w_member_social"
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${scope}`
  
  console.log("Redirecting to LinkedIn OAuth URL:", authUrl)
  res.redirect(authUrl)
})

// GET /api/oauth/linkedin/callback - Handle OAuth callback
router.get('/linkedin/callback', async (req: Request, res: Response) => {
  console.log("Received LinkedIn OAuth callback with query:", req.query)
  
  const { code, state, error } = req.query
  
  if (error) {
    console.error('LinkedIn OAuth error:', error)
    return res.send(`<script>window.opener.postMessage({type: 'oauth_error', platform: 'linkedin', error: '${error}'}, '*'); window.close();</script>`)
  }

  if (!code || !state) {
    return res.send(`<script>window.opener.postMessage({type: 'oauth_error', platform: 'linkedin', error: 'Missing code or state'}, '*'); window.close();</script>`)
  }

  let user_id
  try {
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString())
    user_id = stateData.user_id
  } catch (err) {
    return res.send(`<script>window.opener.postMessage({type: 'oauth_error', platform: 'linkedin', error: 'Invalid state parameter'}, '*'); window.close();</script>`)
  }</old_str>
  
  const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID as string
  const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET as string
  const REDIRECT_URI = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/linkedin/callback`

  try {
    // Exchange authorization code for access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })

    console.log("Exchanging code for access token with params:", {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET ? '***' : 'MISSING'
    })

    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      tokenParams.toString(),
      { 
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    )

    const { access_token, expires_in, scope } = tokenResponse.data
    console.log("Received access token from LinkedIn, expires in:", expires_in)

    // Get user profile from LinkedIn
    let profileData = null
    try {
      const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      })
      profileData = profileResponse.data
      console.log("Retrieved LinkedIn profile:", profileData)
    } catch (profileErr) {
      console.warn("Failed to retrieve LinkedIn profile:", profileErr)
    }

    // Calculate expiration time
    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null

    // Store or update access token in database
    try {
      // First, check if token already exists for this user and platform
      const existingToken = await db
        .select()
        .from(oauth_tokens)
        .where(and(
          eq(oauth_tokens.user_id, user_id),
          eq(oauth_tokens.platform, 'linkedin')
        ))
        .limit(1)

      if (existingToken.length > 0) {
        // Update existing token
        await db
          .update(oauth_tokens)
          .set({
            access_token,
            expires_at: expiresAt,
            scope,
            profile_data: profileData,
            updated_at: new Date()
          })
          .where(and(
            eq(oauth_tokens.user_id, user_id),
            eq(oauth_tokens.platform, 'linkedin')
          ))
      } else {
        // Insert new token
        await db.insert(oauth_tokens).values({
          user_id,
          platform: 'linkedin',
          access_token,
          expires_at: expiresAt,
          scope,
          profile_data: profileData
        })
      }
      console.log("Stored LinkedIn access token in database")
    } catch (dbErr) {
      console.error("Failed to store token in database:", dbErr)
      // Continue anyway - we can still notify the frontend
    }
    
    res.send(`
      <script>
        // Notify parent window of successful OAuth
        window.opener.postMessage({
          type: 'oauth_success', 
          platform: 'linkedin',
          profile: ${JSON.stringify(profileData)}
        }, '*');
        
        window.close();
      </script>
    `)

  } catch (err) {
    console.error('LinkedIn OAuth token exchange failed:', err)
    const errorMessage = axios.isAxiosError(err) 
      ? err.response?.data?.error_description || err.message
      : 'Token exchange failed'
    
    res.send(`<script>window.opener.postMessage({type: 'oauth_error', platform: 'linkedin', error: '${errorMessage}'}, '*'); window.close();</script>`)
  }
})

// GET /api/oauth/status/:userId - Check OAuth connection status for all platforms
router.get('/status/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params
  
  try {
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const tokens = await db
      .select({
        platform: oauth_tokens.platform,
        expires_at: oauth_tokens.expires_at,
        profile_data: oauth_tokens.profile_data
      })
      .from(oauth_tokens)
      .where(eq(oauth_tokens.user_id, userId))

    const status: Record<string, any> = {}
    
    // Initialize all platforms as disconnected first
    const allPlatforms = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube']
    allPlatforms.forEach(platform => {
      status[platform] = {
        connected: false,
        expired: false,
        profile: null
      }
    })
    
    // Update with actual token status
    tokens.forEach(token => {
      const isExpired = token.expires_at ? new Date() > new Date(token.expires_at) : false
      status[token.platform] = {
        connected: !isExpired,
        expired: isExpired,
        profile: token.profile_data
      }
    })

    res.json(status)
  } catch (error) {
    console.error('Failed to check OAuth status:', error)
    res.status(500).json({ error: 'Failed to check OAuth status' })
  }
})

// GET /api/oauth/token/:userId/:platform - Get access token for publishing
router.get('/token/:userId/:platform', async (req: Request, res: Response) => {
  const { userId, platform } = req.params
  
  try {
    const token = await db
      .select({
        access_token: oauth_tokens.access_token,
        expires_at: oauth_tokens.expires_at
      })
      .from(oauth_tokens)
      .where(and(
        eq(oauth_tokens.user_id, userId),
        eq(oauth_tokens.platform, platform)
      ))
      .limit(1)

    if (!token.length) {
      return res.status(404).json({ error: `No ${platform} token found` })
    }

    const tokenData = token[0]
    const isExpired = tokenData.expires_at ? new Date() > new Date(tokenData.expires_at) : false
    
    if (isExpired) {
      return res.status(401).json({ error: `${platform} token expired` })
    }

    res.json({ access_token: tokenData.access_token })
  } catch (error) {
    console.error('Failed to get OAuth token:', error)
    res.status(500).json({ error: 'Failed to get OAuth token' })
  }
})

// GET /api/oauth/facebook - Initiate Facebook OAuth flow
router.get('/facebook', (req: Request, res: Response) => {
  const { user_id } = req.query
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' })
  }
  
  const CLIENT_ID = process.env.FACEBOOK_CLIENT_ID as string
  
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'Facebook OAuth not configured. Please add FACEBOOK_CLIENT_ID to environment variables.' })
  }

  const REDIRECT_URI = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/facebook/callback`
  const state = Buffer.from(JSON.stringify({ user_id })).toString('base64')
  const scope = "pages_manage_posts,pages_read_engagement"
  
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${scope}`
  
  res.redirect(authUrl)
})

// GET /api/oauth/instagram - Initiate Instagram OAuth flow
router.get('/instagram', (req: Request, res: Response) => {
  const { user_id } = req.query
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' })
  }
  
  const CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID as string
  
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'Instagram OAuth not configured. Please add INSTAGRAM_CLIENT_ID to environment variables.' })
  }

  const REDIRECT_URI = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/instagram/callback`
  const state = Buffer.from(JSON.stringify({ user_id })).toString('base64')
  const scope = "instagram_basic,instagram_content_publish"
  
  const authUrl = `https://api.instagram.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${scope}`
  
  res.redirect(authUrl)
})

// GET /api/oauth/twitter - Initiate Twitter OAuth flow
router.get('/twitter', (req: Request, res: Response) => {
  const { user_id } = req.query
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' })
  }
  
  const CLIENT_ID = process.env.TWITTER_CLIENT_ID as string
  
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'Twitter OAuth not configured. Please add TWITTER_CLIENT_ID to environment variables.' })
  }

  const REDIRECT_URI = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/twitter/callback`
  const state = Buffer.from(JSON.stringify({ user_id })).toString('base64')
  const scope = "tweet.read tweet.write users.read offline.access"
  
  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${scope}&code_challenge=challenge&code_challenge_method=plain`
  
  res.redirect(authUrl)
})

// GET /api/oauth/tiktok - Initiate TikTok OAuth flow
router.get('/tiktok', (req: Request, res: Response) => {
  const { user_id } = req.query
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' })
  }
  
  const CLIENT_ID = process.env.TIKTOK_CLIENT_ID as string
  
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'TikTok OAuth not configured. Please add TIKTOK_CLIENT_ID to environment variables.' })
  }

  const REDIRECT_URI = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/tiktok/callback`
  const state = Buffer.from(JSON.stringify({ user_id })).toString('base64')
  const scope = "user.info.basic,video.upload"
  
  const authUrl = `https://www.tiktok.com/v2/auth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${scope}`
  
  res.redirect(authUrl)
})

// GET /api/oauth/youtube - Initiate YouTube OAuth flow
router.get('/youtube', (req: Request, res: Response) => {
  const { user_id } = req.query
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' })
  }
  
  const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID as string
  
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'YouTube OAuth not configured. Please add YOUTUBE_CLIENT_ID to environment variables.' })
  }

  const REDIRECT_URI = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/youtube/callback`
  const state = Buffer.from(JSON.stringify({ user_id })).toString('base64')
  const scope = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube"
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
  
  res.redirect(authUrl)
})

export default router
