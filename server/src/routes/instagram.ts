import express, { Request, Response } from 'express'
import axios from 'axios'

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

export default router
