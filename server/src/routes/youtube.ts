import express, { Request, Response } from 'express'
import axios from 'axios'

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

export default router
