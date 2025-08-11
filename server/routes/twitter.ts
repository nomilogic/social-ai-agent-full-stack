import express, { Request, Response } from 'express'
import axios from 'axios'

const router = express.Router()

// GET /api/twitter/me - Get Twitter user profile
router.get('/me', async (req: Request, res: Response) => {
  const accessToken = req.query.access_token as string

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' })
  }

  try {
    const response = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        'user.fields': 'id,name,username,description,public_metrics,profile_image_url,verified'
      }
    })

    res.json({
      success: true,
      user: response.data.data
    })
  } catch (error: any) {
    console.error('Error fetching Twitter profile:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to fetch Twitter profile',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/twitter/post - Create Twitter post (tweet)
router.post('/post', async (req: Request, res: Response) => {
  const { accessToken, post } = req.body

  if (!accessToken || !post) {
    return res.status(400).json({ error: 'Missing accessToken or post data' })
  }

  try {
    let tweetText = `${post.caption}\n\n${post.hashtags ? post.hashtags.join(' ') : ''}`
    
    // Twitter character limit is 280
    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + '...'
    }

    const tweetData: any = {
      text: tweetText
    }

    // Handle media if provided
    if (post.imageUrl) {
      try {
        const mediaId = await uploadMediaToTwitter(accessToken, post.imageUrl)
        if (mediaId) {
          tweetData.media = {
            media_ids: [mediaId]
          }
        }
      } catch (mediaError) {
        console.warn('Failed to upload media to Twitter:', mediaError)
        // Continue without media if upload fails
      }
    }

    const response = await axios.post('https://api.twitter.com/2/tweets', tweetData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    res.json({
      success: true,
      data: response.data,
      platform: 'twitter',
      postId: response.data.data.id,
      tweetUrl: `https://twitter.com/i/web/status/${response.data.data.id}`
    })

  } catch (error: any) {
    console.error('Twitter post error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to create Twitter post',
      details: error.response?.data || error.message
    })
  }
})

// POST /api/twitter/thread - Create Twitter thread
router.post('/thread', async (req: Request, res: Response) => {
  const { accessToken, posts } = req.body

  if (!accessToken || !posts || !Array.isArray(posts) || posts.length === 0) {
    return res.status(400).json({ error: 'Missing accessToken or posts array is empty' })
  }

  try {
    const tweetIds = []
    let previousTweetId: string | undefined

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]
      let tweetText = `${post.caption}\n\n${post.hashtags ? post.hashtags.join(' ') : ''}`
      
      // Add thread numbering for posts beyond the first
      if (i > 0) {
        tweetText = `${i + 1}/ ${tweetText}`
      }
      
      // Twitter character limit
      if (tweetText.length > 280) {
        tweetText = tweetText.substring(0, 277) + '...'
      }

      const tweetData: any = {
        text: tweetText
      }

      // Reply to previous tweet for threading
      if (previousTweetId) {
        tweetData.reply = {
          in_reply_to_tweet_id: previousTweetId
        }
      }

      // Handle media
      if (post.imageUrl) {
        try {
          const mediaId = await uploadMediaToTwitter(accessToken, post.imageUrl)
          if (mediaId) {
            tweetData.media = {
              media_ids: [mediaId]
            }
          }
        } catch (mediaError) {
          console.warn('Failed to upload media for thread tweet:', mediaError)
        }
      }

      const response = await axios.post('https://api.twitter.com/2/tweets', tweetData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      const tweetId = response.data.data.id
      tweetIds.push(tweetId)
      previousTweetId = tweetId

      // Small delay between tweets to avoid rate limits
      if (i < posts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    res.json({
      success: true,
      platform: 'twitter',
      threadLength: tweetIds.length,
      tweetIds: tweetIds,
      threadUrl: `https://twitter.com/i/web/status/${tweetIds[0]}`
    })

  } catch (error: any) {
    console.error('Twitter thread error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to create Twitter thread',
      details: error.response?.data || error.message
    })
  }
})

// Helper function to upload media to Twitter
async function uploadMediaToTwitter(accessToken: string, imageUrl: string): Promise<string | null> {
  try {
    // First, fetch the image
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    })

    const imageBuffer = Buffer.from(imageResponse.data)
    const base64Image = imageBuffer.toString('base64')

    // Upload to Twitter media endpoint
    const uploadResponse = await axios.post('https://upload.twitter.com/1.1/media/upload.json', 
      new URLSearchParams({
        media_data: base64Image
      }), 
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    return uploadResponse.data.media_id_string
  } catch (error: any) {
    console.error('Twitter media upload error:', error.response?.data || error.message)
    return null
  }
}

export default router
