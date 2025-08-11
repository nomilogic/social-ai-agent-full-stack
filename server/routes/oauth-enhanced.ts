import express, { Request, Response } from 'express'
import axios from 'axios'

const router = express.Router()

interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
  authUrl: string
  tokenUrl: string
}

// OAuth configurations for all platforms
const getOAuthConfig = (platform: string, req?: Request): OAuthConfig => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5173'

  const configs: Record<string, OAuthConfig> = {
    linkedin: {
      clientId: process.env.VITE_LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.VITE_LINKEDIN_CLIENT_SECRET!,
      redirectUri: `${baseUrl}/oauth/linkedin/callback`,
      scopes: ['openid', 'profile', 'email', 'w_member_social'],
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken'
    },
    facebook: {
      clientId: process.env.VITE_FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.VITE_FACEBOOK_CLIENT_SECRET!,
      redirectUri: `${baseUrl}/oauth/facebook/callback`,
      scopes: ['pages_manage_posts', 'pages_read_engagement', 'publish_to_groups', 'instagram_basic', 'instagram_content_publish'],
      authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token'
    },
    instagram: {
      clientId: process.env.VITE_INSTAGRAM_CLIENT_ID!,
      clientSecret: process.env.VITE_INSTAGRAM_CLIENT_SECRET!,
      redirectUri: `${baseUrl}/oauth/instagram/callback`,
      scopes: ['instagram_basic', 'instagram_content_publish'],
      authUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token'
    },
    twitter: {
      clientId: process.env.VITE_TWITTER_CLIENT_ID!,
      clientSecret: process.env.VITE_TWITTER_CLIENT_SECRET!,
      redirectUri: `${baseUrl}/oauth/twitter/callback`,
      scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token'
    },
    tiktok: {
      clientId: process.env.VITE_TIKTOK_CLIENT_ID!,
      clientSecret: process.env.VITE_TIKTOK_CLIENT_SECRET!,
      redirectUri: `${baseUrl}/oauth/tiktok/callback`,
      scopes: ['user.info.basic', 'video.upload'],
      authUrl: 'https://www.tiktok.com/v2/auth/authorize',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token'
    },
    youtube: {
      clientId: process.env.VITE_YOUTUBE_CLIENT_ID!,
      clientSecret: process.env.VITE_YOUTUBE_CLIENT_SECRET!,
      redirectUri: `${baseUrl}/oauth/youtube/callback`,
      scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube'],
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token'
    }
  }

  return configs[platform]
}

// GET /api/oauth/:platform - Initiate OAuth flow for any platform
router.get('/:platform', (req: Request, res: Response) => {
  const { platform } = req.params
  const { user_id, state } = req.query

  console.log(`Initiating OAuth flow for ${platform}`)

  try {
    const config = getOAuthConfig(platform, req)
    if (!config) {
      return res.status(400).json({ error: `Unsupported platform: ${platform}` })
    }

    const stateParam = state || `${platform}_${user_id}_${Math.random().toString(36).substring(2, 15)}`
    
    const authParams = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state: stateParam as string,
      access_type: 'offline', // For refresh tokens
      prompt: 'consent'
    })

    // Platform-specific parameters
    if (platform === 'twitter') {
      authParams.set('code_challenge', 'challenge') // PKCE for Twitter
      authParams.set('code_challenge_method', 'plain')
    }

    const authUrl = `${config.authUrl}?${authParams.toString()}`
    console.log(`Redirecting to ${platform} OAuth URL:`, authUrl)
    
    res.redirect(authUrl)
  } catch (error: any) {
    console.error(`OAuth initiation error for ${platform}:`, error)
    res.status(500).json({ error: `Failed to initiate OAuth for ${platform}` })
  }
})

// POST /api/oauth/:platform/callback - Handle OAuth callback for any platform
router.post('/:platform/callback', async (req: Request, res: Response) => {
  const { platform } = req.params
  let { code, redirect_uri, grant_type = 'authorization_code' } = req.body

  console.log(`Handling OAuth callback for ${platform}`)

  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'Missing required parameters: code and redirect_uri' })
  }

  try {
    const config = getOAuthConfig(platform)
    if (!config) {
      return res.status(400).json({ error: `Unsupported platform: ${platform}` })
    }

    const tokenData: any = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      grant_type: grant_type,
      redirect_uri: redirect_uri
    }

    // Platform-specific token request modifications
    if (platform === 'twitter') {
      tokenData.code_verifier = 'challenge' // PKCE for Twitter
    }

    const response = await axios.post(config.tokenUrl, 
      new URLSearchParams(tokenData).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    )

    let tokenResponse = response.data

    // For Facebook/Instagram, exchange for long-lived token
    if ((platform === 'facebook' || platform === 'instagram') && tokenResponse.access_token) {
      try {
        const longLivedResponse = await axios.get(config.tokenUrl, {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: config.clientId,
            client_secret: config.clientSecret,
            fb_exchange_token: tokenResponse.access_token
          }
        })
        
        if (longLivedResponse.data.access_token) {
          tokenResponse = longLivedResponse.data
        }
      } catch (exchangeError) {
        console.warn('Failed to exchange for long-lived token:', exchangeError)
        // Continue with short-lived token
      }
    }

    res.json({
      success: true,
      platform: platform,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_in: tokenResponse.expires_in,
      token_type: tokenResponse.token_type || 'Bearer',
      scope: tokenResponse.scope
    })

  } catch (error: any) {
    console.error(`OAuth callback error for ${platform}:`, error.response?.data || error.message)
    res.status(500).json({
      error: `Failed to complete OAuth for ${platform}`,
      details: error.response?.data || error.message
    })
  }
})

// POST /api/oauth/:platform/refresh - Refresh access token
router.post('/:platform/refresh', async (req: Request, res: Response) => {
  const { platform } = req.params
  const { refresh_token } = req.body

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required' })
  }

  try {
    const config = getOAuthConfig(platform)
    if (!config) {
      return res.status(400).json({ error: `Unsupported platform: ${platform}` })
    }

    const refreshData = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refresh_token,
      grant_type: 'refresh_token'
    }

    const response = await axios.post(config.tokenUrl,
      new URLSearchParams(refreshData).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    )

    res.json({
      success: true,
      platform: platform,
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token || refresh_token, // Keep old refresh token if not provided
      expires_in: response.data.expires_in,
      token_type: response.data.token_type || 'Bearer'
    })

  } catch (error: any) {
    console.error(`Token refresh error for ${platform}:`, error.response?.data || error.message)
    res.status(500).json({
      error: `Failed to refresh token for ${platform}`,
      details: error.response?.data || error.message
    })
  }
})

// GET /api/oauth/:platform/validate - Validate access token
router.get('/:platform/validate', async (req: Request, res: Response) => {
  const { platform } = req.params
  const { access_token } = req.query

  if (!access_token) {
    return res.status(400).json({ error: 'Access token is required' })
  }

  try {
    let validationUrl: string
    let headers: any = {}

    // Platform-specific validation endpoints
    switch (platform) {
      case 'linkedin':
        validationUrl = 'https://api.linkedin.com/v2/userinfo'
        headers['Authorization'] = `Bearer ${access_token}`
        break
      case 'facebook':
      case 'instagram':
        validationUrl = `https://graph.facebook.com/me?access_token=${access_token}`
        break
      case 'twitter':
        validationUrl = 'https://api.twitter.com/2/users/me'
        headers['Authorization'] = `Bearer ${access_token}`
        break
      case 'youtube':
        validationUrl = 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true'
        headers['Authorization'] = `Bearer ${access_token}`
        break
      case 'tiktok':
        validationUrl = 'https://open.tiktokapis.com/v2/user/info/'
        headers['Authorization'] = `Bearer ${access_token}`
        break
      default:
        return res.status(400).json({ error: `Token validation not implemented for ${platform}` })
    }

    const response = await axios.get(validationUrl, { headers })

    res.json({
      success: true,
      platform: platform,
      valid: true,
      user: response.data
    })

  } catch (error: any) {
    console.error(`Token validation error for ${platform}:`, error.response?.data || error.message)
    
    if (error.response?.status === 401) {
      res.json({
        success: false,
        platform: platform,
        valid: false,
        error: 'Invalid or expired token'
      })
    } else {
      res.status(500).json({
        error: `Failed to validate token for ${platform}`,
        details: error.response?.data || error.message
      })
    }
  }
})

export default router
