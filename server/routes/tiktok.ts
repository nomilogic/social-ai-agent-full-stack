import express, { Request, Response } from 'express'
import axios from 'axios'

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

export default router
