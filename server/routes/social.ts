import express, { Request, Response } from 'express'
import linkedinRouter from './linkedin'
import facebookRouter from './facebook'
import instagramRouter from './instagram'
import twitterRouter from './twitter'
import tiktokRouter from './tiktok'
import youtubeRouter from './youtube'

const router = express.Router()

// Mount platform routes
router.use('/linkedin', linkedinRouter)
router.use('/facebook', facebookRouter)
router.use('/instagram', instagramRouter)
router.use('/twitter', twitterRouter)
router.use('/tiktok', tiktokRouter)
router.use('/youtube', youtubeRouter)

// Multi-platform posting endpoint
router.post('/post-all', async (req: Request, res: Response) => {
  const { platforms, post } = req.body
  
  if (!platforms || !post) {
    return res.status(400).json({ error: 'Missing platforms or post data' })
  }

  const results: any = {}
  
  // This would iterate through platforms and post to each
  // For now, just a placeholder structure
  for (const platform of platforms) {
    try {
      // Platform-specific posting logic would go here
      results[platform] = { success: false, message: `${platform} posting not yet implemented` }
    } catch (error: any) {
      results[platform] = { success: false, error: error.message }
    }
  }

  res.json({
    success: Object.values(results).some((result: any) => result.success),
    results
  })
})

export default router
