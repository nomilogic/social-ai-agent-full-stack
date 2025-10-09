import express, { Request, Response } from 'express'
import axios from 'axios'
import { db } from '../db'
import { oauth_tokens } from '../../shared/schema'
import { eq, and } from 'drizzle-orm'

const router = express.Router()

// GET /api/tiktok/me - Get TikTok user info
router.get('/me', async (req: Request, res: Response) => {
  const accessToken = req.query.access_token as string

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' })
  }

  try {
    const response = await axios.post('https://open.tiktokapis.com/v2/user/info/', {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    res.json({
      success: true,
      user: response.data.data.user
    })
  } catch (error: any) {
    console.error('Error fetching TikTok profile:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to fetch TikTok profile',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/tiktok/upload-init - Initialize video upload
router.post('/upload-init', async (req: Request, res: Response) => {
  const { accessToken, post } = req.body

  if (!accessToken || !post) {
    return res.status(400).json({ error: 'Missing accessToken or post data' })
  }

  try {
    const uploadData = {
      post_info: {
        title: post.caption ? post.caption.slice(0, 150) : 'TikTok Post',
        privacy_level: 'MUTUAL_FOLLOW_FRIENDS', // Options: PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, SELF_ONLY
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: 50000000, // Max 50MB
        chunk_size: 10000000,  // 10MB chunks
        total_chunk_count: 1
      }
    }

    const response = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', uploadData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    res.json({
      success: true,
      data: response.data,
      uploadUrl: response.data.data.upload_url,
      publishId: response.data.data.publish_id
    })

  } catch (error: any) {
    console.error('TikTok upload init error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to initialize TikTok upload',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/tiktok/upload-video - Upload video file to TikTok
router.post('/upload-video', async (req: Request, res: Response) => {
  const { uploadUrl, videoUrl } = req.body

  if (!uploadUrl || !videoUrl) {
    return res.status(400).json({ error: 'Missing uploadUrl or videoUrl' })
  }

  try {
    // First fetch the video file
    const videoResponse = await axios.get(videoUrl, {
      responseType: 'stream'
    })

    // Upload video to TikTok's upload URL
    const uploadResponse = await axios.put(uploadUrl, videoResponse.data, {
      headers: {
        'Content-Type': 'video/mp4'
      }
    })

    res.json({
      success: true,
      uploaded: true
    })

  } catch (error: any) {
    console.error('TikTok video upload error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to upload video to TikTok',
      details: error.response?.data || error.message
    })
  }
})

// GET /api/tiktok/publish-status - Check publishing status
router.get('/publish-status', async (req: Request, res: Response) => {
  const { access_token: accessToken, publish_id: publishId } = req.query

  if (!accessToken || !publishId) {
    return res.status(400).json({ error: 'Access token and publish ID are required' })
  }

  try {
    const response = await axios.post('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
      publish_id: publishId
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    res.json({
      success: true,
      status: response.data.data.status,
      failReason: response.data.data.fail_reason
    })

  } catch (error: any) {
    console.error('TikTok status check error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to check TikTok publish status',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/tiktok/complete-upload - Complete the upload process
router.post('/complete-upload', async (req: Request, res: Response) => {
  const { accessToken, publishId } = req.body

  if (!accessToken || !publishId) {
    return res.status(400).json({ error: 'Missing accessToken or publishId' })
  }

  try {
    // TikTok automatically processes the video after upload
    // We can check the status periodically
    let attempts = 0
    const maxAttempts = 10
    let status = 'PROCESSING_DOWNLOAD'

    while (attempts < maxAttempts && status !== 'PUBLISH_COMPLETE' && status !== 'FAILED') {
      const statusResponse = await axios.post('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        publish_id: publishId
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      status = statusResponse.data.data.status

      if (status === 'PUBLISH_COMPLETE') {
        return res.json({
          success: true,
          platform: 'tiktok',
          publishId: publishId,
          status: 'published'
        })
      }

      if (status === 'FAILED') {
        return res.status(500).json({
          error: 'TikTok publish failed',
          details: statusResponse.data.data.fail_reason
        })
      }

      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000))
      attempts++
    }

    // If we've reached max attempts, return current status
    res.json({
      success: true,
      platform: 'tiktok',
      publishId: publishId,
      status: status,
      message: 'Upload initiated, processing in background'
    })

  } catch (error: any) {
    console.error('TikTok upload completion error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to complete TikTok upload',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/tiktok/access-token - Handle TikTok OAuth callback
router.post('/access-token', async (req: Request, res: Response) => {
  console.log('🔄 Received TikTok OAuth callback request');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Request headers:', {
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...',
    'origin': req.headers.origin
  });
  
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
      console.log('📋 Parsed JSON body successfully');
    } catch (e) {
      console.error('❌ Failed to parse JSON body:', e.message);
      return res.status(400).json({ error: 'Invalid JSON body' })
    }
  }
  
  const { code, redirect_uri, user_id, code_verifier } = body
  
  console.log('🔍 OAuth parameters received:', {
    hasCode: !!code,
    codeLength: code?.length || 0,
    hasRedirectUri: !!redirect_uri,
    redirectUri: redirect_uri,
    hasUserId: !!user_id,
    userId: user_id,
    hasCodeVerifier: !!code_verifier,
    codeVerifierLength: code_verifier?.length || 0
  });
  
  // Validate required parameters with detailed error messages
  if (!code || typeof code !== 'string') {
    console.error('❌ Missing or invalid authorization code:', { code: typeof code, hasCode: !!code });
    return res.status(400).json({ 
      error: 'Missing or invalid authorization code',
      details: 'The authorization code from TikTok is required for token exchange'
    })
  }
  
  if (!redirect_uri || typeof redirect_uri !== 'string') {
    console.error('❌ Missing or invalid redirect_uri:', { redirect_uri, type: typeof redirect_uri });
    return res.status(400).json({ 
      error: 'Missing or invalid redirect_uri',
      details: 'The redirect URI must match the one used in the authorization request'
    })
  }
  
  if (!code_verifier || typeof code_verifier !== 'string') {
    console.error('❌ Missing code_verifier for PKCE:', { 
      hasCodeVerifier: !!code_verifier, 
      type: typeof code_verifier,
      allKeys: Object.keys(body)
    });
    return res.status(400).json({ 
      error: 'Missing code_verifier for PKCE',
      details: 'The code_verifier parameter is required for PKCE security. This suggests the OAuth flow was not properly initialized.',
      troubleshooting: {
        possibleCauses: [
          'PKCE parameters were not stored in localStorage before starting OAuth',
          'localStorage was cleared during the OAuth process',
          'Popup window could not access localStorage',
          'OAuth flow was initiated incorrectly'
        ],
        solutions: [
          'Ensure you are logged in to the app before connecting TikTok',
          'Check that popups are allowed in your browser',
          'Try refreshing the page and connecting again',
          'Clear browser cache and localStorage, then try again'
        ]
      }
    })
  }
  
  // Validate code_verifier length (43-128 characters per RFC 7636)
  if (code_verifier.length < 43 || code_verifier.length > 128) {
    console.error('❌ Invalid code_verifier length:', { 
      length: code_verifier.length, 
      verifier: code_verifier.substring(0, 20) + '...' 
    });
    return res.status(400).json({ 
      error: `Invalid code_verifier length: ${code_verifier.length}. Must be between 43-128 characters.`,
      details: 'The code_verifier must comply with PKCE RFC 7636 specifications'
    })
  }
  
  // Validate code_verifier characters (must be unreserved characters per RFC 7636)
  const validCodeVerifierPattern = /^[A-Za-z0-9\-._~]+$/;
  if (!validCodeVerifierPattern.test(code_verifier)) {
    console.error('❌ Invalid code_verifier format:', { 
      verifier: code_verifier.substring(0, 50) + '...',
      invalidChars: code_verifier.split('').filter(c => !validCodeVerifierPattern.test(c))
    });
    return res.status(400).json({ 
      error: 'Invalid code_verifier format. Must contain only unreserved characters [A-Z] [a-z] [0-9] - . _ ~',
      details: 'The code_verifier contains invalid characters that are not allowed by PKCE RFC 7636'
    })
  }
  
  console.log('✅ Code verifier validation passed');
  
  // Get client credentials
  const clientKey = process.env.VITE_TIKTOK_CLIENT_ID || process.env.TIKTOK_CLIENT_ID || process.env.TIKTOK_CLIENT_KEY || ''
  const clientSecret = process.env.VITE_TIKTOK_CLIENT_SECRET || process.env.TIKTOK_CLIENT_SECRET || ''
  
  if (!clientKey || !clientSecret) {
    console.error('TikTok OAuth credentials not configured')
    return res.status(500).json({ error: 'TikTok OAuth not properly configured' })
  }
  
  // TikTok expects x-www-form-urlencoded, so build params string
  const params = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri,
    code_verifier
  })
  console.log('TikTok token exchange request params:', {
    client_key: params.get('client_key') ? '[REDACTED]' : 'MISSING',
    client_secret: params.get('client_secret') ? '[REDACTED]' : 'MISSING',
    code: params.get('code') ? '[REDACTED]' : 'MISSING',
    redirect_uri: params.get('redirect_uri'),
    code_verifier: params.get('code_verifier') ? '[REDACTED]' : 'MISSING',
    grant_type: params.get('grant_type')
  })
  
  try {
    console.log('🔄 Making TikTok token exchange request to:', 'https://open.tiktokapis.com/v2/oauth/token/');
    console.log('⏱️ Request timeout: 30 seconds');
    
    const response = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      params.toString(),
      { 
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        },
        timeout: 30000 // 30 second timeout
      }
    )
    
    console.log('Raw TikTok API response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    console.log('TikTok token exchange successful:', {
      hasAccessToken: !!response.data.access_token,
      hasRefreshToken: !!response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type,
      scope: response.data.scope
    })
    
    // Validate response has access token
    if (!response.data.access_token) {
      console.error('TikTok token response missing access_token:', response.data)
      return res.status(500).json({
        error: 'Invalid token response from TikTok',
        details: 'Access token not present in response'
      })
    }
    
    // Save token to database if user_id is provided
    if (user_id && response.data.access_token) {
      try {
        let expires_at: Date | null = null
        if (response.data.expires_in) {
          expires_at = new Date(Date.now() + (response.data.expires_in * 1000))
        }
        
        const existingToken = await db
          .select()
          .from(oauth_tokens)
          .where(and(
            eq(oauth_tokens.user_id, user_id),
            eq(oauth_tokens.platform, 'tiktok')
          ))
          .limit(1)
          
        if (existingToken.length > 0) {
          await db
            .update(oauth_tokens)
            .set({
              access_token: response.data.access_token,
              refresh_token: response.data.refresh_token || null,
              expires_at: expires_at,
              token_type: response.data.token_type || 'Bearer',
              updated_at: new Date()
            })
            .where(and(
              eq(oauth_tokens.user_id, user_id),
              eq(oauth_tokens.platform, 'tiktok')
            ))
        } else {
          await db.insert(oauth_tokens).values({
            user_id: user_id,
            platform: 'tiktok',
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token || null,
            token_type: response.data.token_type || 'Bearer',
            expires_at: expires_at
          })
        }
        console.log(`TikTok token stored successfully for user ${user_id}`)
      } catch (storeError) {
        console.error('Failed to store TikTok token:', storeError)
        // Don't fail the request if storage fails - user can still use the token
      }
    }
    
    res.json({
      ...response.data,
      success: true
    })
  } catch (error: any) {
    console.error('TikTok token exchange error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    })
    
    // Handle specific TikTok API errors with detailed troubleshooting
    if (error.response?.status === 400 && error.response?.data) {
      const errorData = error.response.data
      console.error('❌ TikTok API returned 400 error:', errorData);
      
      let errorMessage = 'TikTok OAuth error'
      let troubleshooting = {};
      
      if (errorData.error === 'invalid_grant') {
        errorMessage = 'Invalid authorization code or code_verifier. Please try connecting again.'
        troubleshooting = {
          possibleCauses: [
            'Authorization code has expired (10 minute limit)',
            'Authorization code has already been used',
            'code_verifier does not match the code_challenge',
            'PKCE parameters were corrupted during storage'
          ],
          solutions: [
            'Start a fresh OAuth flow from the beginning',
            'Ensure you complete the OAuth process quickly',
            'Check that localStorage is working properly',
            'Verify your app is properly configured in TikTok Developer Portal'
          ]
        };
      } else if (errorData.error === 'invalid_request') {
        errorMessage = 'Invalid PKCE parameters. Please check your OAuth configuration.'
        troubleshooting = {
          possibleCauses: [
            'Missing or malformed PKCE parameters',
            'Incorrect redirect URI configuration',
            'Invalid client credentials',
            'OAuth scope issues'
          ],
          solutions: [
            'Verify TikTok app configuration in Developer Portal',
            'Check that redirect URI exactly matches registered URI',
            'Ensure client ID and secret are correct',
            'Verify app has proper scopes enabled'
          ]
        };
      } else if (errorData.error_description) {
        errorMessage = errorData.error_description
      }
      
      return res.status(400).json({
        error: errorMessage,
        details: errorData,
        troubleshooting
      })
    }
    
    res.status(500).json({
      error: 'Failed to exchange TikTok authorization code for access token',
      details: error.response?.data || error.message
    })
  }
})

// GET /api/tiktok/oauth_tokens - Get TikTok OAuth tokens for a user
router.get('/oauth_tokens', async (req: Request, res: Response) => {
  const { user_id } = req.query
  
  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'user_id parameter is required' })
  }
  
  try {
    console.log(`Fetching TikTok tokens for user: ${user_id}`)
    
    const tokens = await db
      .select()
      .from(oauth_tokens)
      .where(and(
        eq(oauth_tokens.user_id, user_id),
        eq(oauth_tokens.platform, 'tiktok')
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
    console.error('Failed to fetch TikTok tokens:', error)
    res.status(500).json({ error: 'Failed to fetch TikTok tokens' })
  }
})

export default router
