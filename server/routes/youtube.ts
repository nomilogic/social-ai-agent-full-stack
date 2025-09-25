import express, { Request, Response } from 'express'
import axios from 'axios'
import { db } from '../db'
import { oauth_tokens } from '../../shared/schema'
import { eq, and } from 'drizzle-orm'
import { downloadMediaFromStorage } from '../lib/supabaseStorage'

const router = express.Router()

// GET /api/youtube/channels - Get user's YouTube channels
router.get('/channels', async (req: Request, res: Response) => {
  const accessToken = req.query.access_token as string

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' })
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        part: 'id,snippet,statistics,brandingSettings',
        mine: true
      }
    })

    res.json({
      success: true,
      channels: response.data.items
    })
  } catch (error: any) {
    console.error('Error fetching YouTube channels:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to fetch YouTube channels',
      details: error.response?.data || error.message
    })
  }
})

// GET /api/youtube/me - Get current user info
router.get('/me', async (req: Request, res: Response) => {
  const accessToken = req.query.access_token as string

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' })
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        part: 'snippet',
        mine: true
      }
    })

    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0]
      res.json({
        success: true,
        user: {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnailUrl: channel.snippet.thumbnails?.default?.url
        }
      })
    } else {
      res.status(404).json({ error: 'No YouTube channel found' })
    }
  } catch (error: any) {
    console.error('Error fetching YouTube profile:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to fetch YouTube profile',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/youtube/post - Simple YouTube posting interface (matches other platforms)
router.post('/post', async (req: Request, res: Response) => {
  const { accessToken, post, videoUrl } = req.body

  if (!accessToken || !post) {
    return res.status(400).json({ error: 'Missing accessToken or post data' })
  }

  if (!videoUrl && !post.imageUrl) {
    return res.status(400).json({ error: 'YouTube requires a video URL' })
  }

  const videoUrlToUse = videoUrl || post.imageUrl
  
  // Validate video URL exists
  if (!videoUrlToUse) {
    return res.status(400).json({ error: 'YouTube requires a video URL or file' })
  }
  
  // Convert relative URL to full URL if needed (similar to LinkedIn image handling)
  let fullVideoUrl = videoUrlToUse;
  if (fullVideoUrl.startsWith('/uploads/')) {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.BASE_URL || 'http://localhost:5000'
      : 'http://localhost:5000';
    fullVideoUrl = `${baseUrl}${fullVideoUrl}`;
  }
  
  // Validate URL format
  try {
    new URL(fullVideoUrl);
  } catch (error) {
    return res.status(400).json({ 
      error: 'Invalid video URL format', 
      details: 'Please provide a valid URL for the video file'
    })
  }
  
  // Skip validation for Supabase URLs as they may not support HEAD requests
  if (!fullVideoUrl.includes('supabase.co')) {
    // Check if URL is accessible before proceeding (only for non-Supabase URLs)
    try {
      const headResponse = await axios.head(fullVideoUrl, { timeout: 10000 });
      const contentType = headResponse.headers['content-type'];
      
      // Validate content type is video
      if (contentType && !contentType.startsWith('video/') && !contentType.startsWith('application/octet-stream')) {
        return res.status(400).json({
          error: 'Invalid video file type',
          details: `Expected video file, but received content type: ${contentType}`
        })
      }
      
      // Check file size (YouTube limit is 256GB, but we'll set a reasonable limit)
      const contentLength = headResponse.headers['content-length'];
      if (contentLength) {
        const fileSizeGB = parseInt(contentLength) / (1024 * 1024 * 1024);
        const fileSizeMB = parseInt(contentLength) / (1024 * 1024);
        
        if (fileSizeGB > 15) { // 15GB limit for reasonable upload times
          return res.status(400).json({
            error: 'Video file too large',
            details: `Video file size (${fileSizeGB.toFixed(2)}GB) exceeds the 15GB limit for uploads`
          })
        }
        
        console.log(`Video size: ${fileSizeMB.toFixed(2)}MB (${fileSizeGB.toFixed(3)}GB)`)
      }
    } catch (error: any) {
      console.warn('Video URL validation warning:', error.message);
      // Continue with upload attempt even if HEAD request fails for non-Supabase URLs
    }
  } else {
    console.log('Skipping URL validation for Supabase storage URL');
  }
  
  console.log('YouTube video URL (original):', videoUrlToUse);
  console.log('YouTube video URL (full):', fullVideoUrl);

  try {
    // Step 1: Download and prepare video data first
    console.log('Downloading video for YouTube upload...')
    const videoBuffer = await downloadMediaFromStorage(fullVideoUrl)
    
    if (!videoBuffer) {
      throw new Error('Failed to download video from storage')
    }
    
    console.log('Video downloaded successfully, size:', videoBuffer.length, 'bytes')
    
    // Check minimum file size (YouTube requires at least a few bytes)
    if (videoBuffer.length < 1000) {
      throw new Error('Video file is too small to be valid')
    }
    
    // Detect content type from buffer if possible
    let contentType = 'video/mp4';
    const firstBytes = videoBuffer.slice(0, 12);
    
    // MP4 detection
    if (firstBytes.includes(Buffer.from('ftyp'))) {
      contentType = 'video/mp4';
    }
    // WebM detection
    else if (firstBytes[0] === 0x1A && firstBytes[1] === 0x45 && firstBytes[2] === 0xDF && firstBytes[3] === 0xA3) {
      contentType = 'video/webm';
    }
    // AVI detection
    else if (firstBytes.includes(Buffer.from('AVI '))) {
      contentType = 'video/avi';
    }
    
    console.log('Detected video content type:', contentType)

    // Step 2: Initialize upload with proper content length
    const metadata = {
      snippet: {
        title: post.caption ? post.caption.slice(0, 100) : 'YouTube Video',
        description: `${post.caption}\n\n${post.hashtags ? post.hashtags.join(' ') : ''}`,
        tags: post.hashtags ? post.hashtags.map((tag: string) => tag.replace('#', '')) : [],
        categoryId: '22', // People & Blogs
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en'
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false
      }
    }

    const initResponse = await axios.post(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      metadata,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': contentType,
          'X-Upload-Content-Length': videoBuffer.length.toString()
        }
      }
    )

    const uploadUrl = initResponse.headers.location
    if (!uploadUrl) {
      throw new Error('Failed to get upload URL from YouTube')
    }

    // Step 3: Upload the video buffer to YouTube
    const uploadHeaders: any = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': contentType,
      'Content-Length': videoBuffer.length.toString()
    }

    console.log('Uploading video buffer to YouTube...', {
      size: `${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`,
      uploadUrl: uploadUrl.substring(0, 100) + '...'
    })
    
    const uploadResponse = await axios.put(uploadUrl, videoBuffer, {
      headers: uploadHeaders,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000, // 5 minute timeout for large video uploads
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          if (percentage % 10 === 0) { // Log every 10%
            console.log(`YouTube upload progress: ${percentage}%`)
          }
        }
      }
    })
    
    console.log('YouTube video upload completed successfully!')

    res.json({
      success: true,
      platform: 'youtube',
      data: uploadResponse.data,
      videoId: uploadResponse.data.id,
      videoUrl: `https://www.youtube.com/watch?v=${uploadResponse.data.id}`
    })

  } catch (error: any) {
    console.error('YouTube post error:', error.message)
    console.error('YouTube error response:', error.response?.data)
    console.error('YouTube error status:', error.response?.status)
    
    // Enhanced error handling with specific YouTube error codes
    const errorData = error.response?.data
    let errorMessage = 'Failed to create YouTube post'
    let statusCode = 500
    
    if (errorData?.error) {
      const ytError = errorData.error
      
      // Handle specific YouTube error codes
      if (ytError.code === 401 || ytError.errors?.some((e: any) => e.reason === 'authError')) {
        errorMessage = 'YouTube access token expired or invalid. Please reconnect your account.'
        statusCode = 401
      } else if (ytError.code === 403) {
        if (ytError.errors?.some((e: any) => e.reason === 'quotaExceeded')) {
          errorMessage = 'YouTube API quota exceeded. Please try again later.'
          statusCode = 429
        } else if (ytError.errors?.some((e: any) => e.reason === 'forbidden')) {
          errorMessage = 'YouTube upload permission denied. Please ensure your account has upload permissions.'
          statusCode = 403
        } else {
          errorMessage = 'YouTube API access forbidden. Please check your permissions.'
          statusCode = 403
        }
      } else if (ytError.code === 400) {
        // Check for specific upload quota errors
        if (ytError.message?.includes('exceeded the number of videos') || ytError.errors?.some((e: any) => e.reason === 'uploadLimitExceeded')) {
          errorMessage = 'YouTube daily upload limit exceeded. You can upload more videos tomorrow (quota resets at midnight PT).'
          statusCode = 429 // Rate limit exceeded
        } else if (ytError.errors?.some((e: any) => e.reason === 'invalidVideoData')) {
          errorMessage = 'Invalid video data. Please check your video file format and size.'
          statusCode = 400
        } else {
          errorMessage = 'Invalid YouTube API request. Please check your video and metadata.'
          statusCode = 400
        }
      } else {
        errorMessage = ytError.message || 'YouTube API error'
        statusCode = error.response?.status || 500
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Unable to connect to YouTube API. Please check your internet connection.'
      statusCode = 503
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Video upload timeout. Please try with a smaller video file.'
      statusCode = 408
    }
    
    // Create a safe error response without circular references
    const safeErrorDetails = errorData ? {
      error: errorData.error,
      message: errorData.message,
      code: errorData.code
    } : (error.message || 'Unknown error')
    
    res.status(statusCode).json({
      error: errorMessage,
      details: safeErrorDetails,
      platform: 'youtube',
      retryable: statusCode >= 500 || statusCode === 429 || statusCode === 408
    })
  }
})

// POST /api/youtube/upload-init - Initialize video upload
router.post('/upload-init', async (req: Request, res: Response) => {
  const { accessToken, post, channelId } = req.body

  if (!accessToken || !post) {
    return res.status(400).json({ error: 'Missing accessToken or post data' })
  }

  try {
    const metadata = {
      snippet: {
        title: post.caption ? post.caption.slice(0, 100) : 'YouTube Video',
        description: `${post.caption}\n\n${post.hashtags ? post.hashtags.join(' ') : ''}`,
        tags: post.hashtags ? post.hashtags.map((tag: string) => tag.replace('#', '')) : [],
        categoryId: '22', // People & Blogs
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en'
      },
      status: {
        privacyStatus: 'public', // public, private, unlisted
        selfDeclaredMadeForKids: false
      }
    }

    // channelId is automatically associated with the authenticated user

    // Initialize resumable upload
    const initResponse = await axios.post(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      metadata,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/*'
        }
      }
    )

    const uploadUrl = initResponse.headers.location

    if (!uploadUrl) {
      throw new Error('Failed to get upload URL from YouTube')
    }

    res.json({
      success: true,
      uploadUrl: uploadUrl,
      metadata: metadata
    })

  } catch (error: any) {
    console.error('YouTube upload init error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to initialize YouTube upload',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/youtube/upload-video - Upload video file to YouTube
router.post('/upload-video', async (req: Request, res: Response) => {
  const { accessToken, uploadUrl, videoUrl } = req.body

  if (!accessToken || !uploadUrl || !videoUrl) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    // First fetch the video file
    const videoResponse = await axios.get(videoUrl, {
      responseType: 'stream'
    })

    // Get content length if available
    const contentLength = videoResponse.headers['content-length']

    // Upload video to YouTube
    const uploadHeaders: any = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'video/*'
    }

    if (contentLength) {
      uploadHeaders['Content-Length'] = contentLength
    }

    const uploadResponse = await axios.put(uploadUrl, videoResponse.data, {
      headers: uploadHeaders,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    })

    res.json({
      success: true,
      platform: 'youtube',
      data: uploadResponse.data,
      videoId: uploadResponse.data.id,
      videoUrl: `https://www.youtube.com/watch?v=${uploadResponse.data.id}`
    })

  } catch (error: any) {
    console.error('YouTube video upload error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to upload video to YouTube',
      details: error.response?.data || error.message
    })
  }
})

// GET /api/youtube/video-status - Check video processing status
router.get('/video-status', async (req: Request, res: Response) => {
  const { access_token: accessToken, video_id: videoId } = req.query

  if (!accessToken || !videoId) {
    return res.status(400).json({ error: 'Access token and video ID are required' })
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        part: 'status,processingDetails',
        id: videoId
      }
    })

    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0]
      res.json({
        success: true,
        status: video.status,
        processingDetails: video.processingDetails
      })
    } else {
      res.status(404).json({ error: 'Video not found' })
    }

  } catch (error: any) {
    console.error('YouTube status check error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to check YouTube video status',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/youtube/update-video - Update video metadata
router.post('/update-video', async (req: Request, res: Response) => {
  const { accessToken, videoId, title, description, tags, categoryId, privacyStatus } = req.body

  if (!accessToken || !videoId) {
    return res.status(400).json({ error: 'Missing accessToken or videoId' })
  }

  try {
    const updateData: any = {
      id: videoId,
      snippet: {}
    }

    if (title) updateData.snippet.title = title
    if (description) updateData.snippet.description = description
    if (tags) updateData.snippet.tags = tags
    if (categoryId) updateData.snippet.categoryId = categoryId

    if (privacyStatus) {
      updateData.status = { privacyStatus }
    }

    const parts = []
    if (Object.keys(updateData.snippet).length > 0) parts.push('snippet')
    if (updateData.status) parts.push('status')

    const response = await axios.put('https://www.googleapis.com/youtube/v3/videos', updateData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        part: parts.join(',')
      }
    })

    res.json({
      success: true,
      data: response.data
    })

  } catch (error: any) {
    console.error('YouTube video update error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to update YouTube video',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/youtube/access-token - Handle YouTube OAuth callback
router.post('/access-token', async (req: Request, res: Response) => {
  console.log('Received YouTube OAuth callback with body:', req.body)
  
  let body = req.body
  if (typeof body === 'string') {
    body = JSON.parse(body)
  }
  
  const { code, redirect_uri, user_id } = body
  
  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'Missing required parameters: code and redirect_uri' })
  }
  
  const tokenData = {
    client_id: process.env.VITE_YOUTUBE_CLIENT_ID || '',
    client_secret: process.env.VITE_YOUTUBE_CLIENT_SECRET || '',
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: redirect_uri
  }
  
  try {
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams(tokenData).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    
    console.log('YouTube access token response:', response.data)
    
    // Save token to database if user_id is provided
    if (user_id && response.data.access_token) {
      try {
        // Calculate expiry date if expires_in is provided
        let expires_at: Date | null = null
        if (response.data.expires_in) {
          expires_at = new Date(Date.now() + (response.data.expires_in * 1000))
        }
        
        // Check if token already exists
        const existingToken = await db
          .select()
          .from(oauth_tokens)
          .where(and(
            eq(oauth_tokens.user_id, user_id),
            eq(oauth_tokens.platform, 'youtube')
          ))
          .limit(1)
        
        if (existingToken.length > 0) {
          // Update existing token
          await db
            .update(oauth_tokens)
            .set({
              access_token: response.data.access_token,
              refresh_token: response.data.refresh_token || null,
              expires_at: expires_at,
              updated_at: new Date()
            })
            .where(and(
              eq(oauth_tokens.user_id, user_id),
              eq(oauth_tokens.platform, 'youtube')
            ))
        } else {
          // Insert new token
          await db.insert(oauth_tokens).values({
            user_id: user_id,
            platform: 'youtube',
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token || null,
            expires_at: expires_at
          })
        }
        
        console.log(`YouTube token stored successfully for user ${user_id}`)
      } catch (storeError) {
        console.error('Failed to store YouTube token:', storeError)
        // Don't fail the request, but log the error
      }
    }
    
    res.json(response.data)
  } catch (error: any) {
    console.error('YouTube token exchange error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to exchange YouTube authorization code for access token',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/youtube/set-thumbnail - Set custom thumbnail for YouTube video
router.post('/set-thumbnail', async (req: Request, res: Response) => {
  const { accessToken, videoId, thumbnailUrl } = req.body

  if (!accessToken || !videoId || !thumbnailUrl) {
    return res.status(400).json({ error: 'Missing required parameters: accessToken, videoId, thumbnailUrl' })
  }

  try {
    console.log(`Setting thumbnail for YouTube video ${videoId}...`)
    
    // Download the thumbnail image
    const thumbnailBuffer = await downloadMediaFromStorage(thumbnailUrl)
    
    if (!thumbnailBuffer) {
      throw new Error('Failed to download thumbnail from storage')
    }
    
    console.log('Thumbnail downloaded successfully, size:', thumbnailBuffer.length, 'bytes')
    
    // Detect image content type from buffer
    let contentType = 'image/jpeg' // Default
    const firstBytes = thumbnailBuffer.slice(0, 12)
    
    if (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8) {
      contentType = 'image/jpeg'
    } else if (firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47) {
      contentType = 'image/png'
    } else if (firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46) {
      contentType = 'image/gif'
    }
    
    console.log('Detected thumbnail content type:', contentType)
    
    // Upload thumbnail to YouTube using thumbnails.set API
    const uploadUrl = `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`
    
    const uploadResponse = await axios.post(uploadUrl, thumbnailBuffer, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': contentType,
        'Content-Length': thumbnailBuffer.length.toString()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000 // 1 minute timeout
    })
    
    console.log('YouTube thumbnail upload completed successfully!')
    
    res.json({
      success: true,
      platform: 'youtube',
      data: uploadResponse.data,
      message: `Thumbnail successfully set for video ${videoId}`
    })
    
  } catch (error: any) {
    console.error('YouTube thumbnail upload error:', error.message)
    console.error('YouTube error response:', error.response?.data)
    console.error('YouTube error status:', error.response?.status)
    
    // Enhanced error handling for thumbnail upload
    const errorData = error.response?.data
    let errorMessage = 'Failed to set YouTube thumbnail'
    let statusCode = 500
    
    if (errorData?.error) {
      const ytError = errorData.error
      
      if (ytError.code === 401) {
        errorMessage = 'YouTube access token expired or invalid. Please reconnect your account.'
        statusCode = 401
      } else if (ytError.code === 403) {
        if (ytError.errors?.some((e: any) => e.reason === 'forbidden')) {
          errorMessage = 'YouTube thumbnail upload permission denied. Your account may not have custom thumbnail privileges.'
          statusCode = 403
        } else {
          errorMessage = 'YouTube API access forbidden for thumbnail upload.'
          statusCode = 403
        }
      } else if (ytError.code === 400) {
        if (ytError.message?.includes('Invalid video')) {
          errorMessage = 'Invalid video ID. The video may not exist or may not be owned by your account.'
          statusCode = 400
        } else {
          errorMessage = 'Invalid thumbnail upload request. Please check your image file.'
          statusCode = 400
        }
      } else {
        errorMessage = ytError.message || 'YouTube thumbnail API error'
        statusCode = error.response?.status || 500
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Unable to connect to YouTube API. Please check your internet connection.'
      statusCode = 503
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Thumbnail upload timeout. Please try again.'
      statusCode = 408
    }
    
    const safeErrorDetails = errorData ? {
      error: errorData.error,
      message: errorData.message,
      code: errorData.code
    } : (error.message || 'Unknown error')
    
    res.status(statusCode).json({
      error: errorMessage,
      details: safeErrorDetails,
      platform: 'youtube',
      retryable: statusCode >= 500 || statusCode === 429 || statusCode === 408
    })
  }
})

// GET /api/youtube/oauth_tokens - Get YouTube OAuth tokens for a user
router.get('/oauth_tokens', async (req: Request, res: Response) => {
  const { user_id } = req.query
  
  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'user_id parameter is required' })
  }
  
  try {
    console.log(`Fetching YouTube tokens for user: ${user_id}`)
    
    const tokens = await db
      .select()
      .from(oauth_tokens)
      .where(and(
        eq(oauth_tokens.user_id, user_id),
        eq(oauth_tokens.platform, 'youtube')
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
    console.error('Failed to fetch YouTube tokens:', error)
    res.status(500).json({ error: 'Failed to fetch YouTube tokens' })
  }
})

export default router
