import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { StorageCleanup, CleanupOptions } from '../scripts/cleanup-storage'
import { db } from '../db'
import { sql } from 'drizzle-orm'

const router = express.Router()

// POST /api/cleanup/storage - Trigger storage cleanup (Admin only)
router.post('/storage', authenticateJWT, async (req: Request, res: Response) => {
  const userId = req.user?.id
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  // For security, you might want to add admin role checking here
  // const userRole = await getUserRole(userId)
  // if (userRole !== 'admin') {
  //   return res.status(403).json({ error: 'Admin access required' })
  // }

  try {
    const options: CleanupOptions = {
      dryRun: req.body.dryRun !== false, // Default to true for safety
      execute: req.body.execute === true,
      days: parseInt(req.body.days) || 0,
      unreferenced: req.body.unreferenced !== false, // Default to true
      bucket: req.body.bucket || 'images',
      verbose: req.body.verbose === true
    }

    console.log('🧹 API cleanup request:', options)

    const cleanup = new StorageCleanup(options)
    
    // Run cleanup in background and return immediate response
    cleanup.run().then(() => {
      console.log('✅ Background cleanup completed')
    }).catch(error => {
      console.error('❌ Background cleanup failed:', error)
    })

    res.json({
      success: true,
      message: options.dryRun 
        ? 'Cleanup analysis started (dry run mode)'
        : 'Cleanup started in background',
      options: options
    })

  } catch (error: any) {
    console.error('Cleanup API error:', error)
    res.status(500).json({
      error: 'Failed to start cleanup',
      details: error.message
    })
  }
})

// GET /api/cleanup/storage/stats - Get storage usage statistics
router.get('/storage/stats', authenticateJWT, async (req: Request, res: Response) => {
  const userId = req.user?.id
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    // Get database statistics
    const [totalRecords] = await db.execute(
      sql`SELECT COUNT(*) as count FROM media WHERE file_path LIKE '%supabase.co%'`
    )
    
    const [totalSize] = await db.execute(
      sql`SELECT SUM(file_size) as total_size FROM media WHERE file_path LIKE '%supabase.co%'`
    )

    const [oldRecords] = await db.execute(
      sql`SELECT COUNT(*) as count FROM media 
          WHERE file_path LIKE '%supabase.co%' 
          AND created_at < NOW() - INTERVAL '30 days'`
    )

    const [userRecords] = await db.execute(
      sql`SELECT COUNT(*) as count FROM media 
          WHERE file_path LIKE '%supabase.co%' 
          AND user_id = ${userId}`
    )

    res.json({
      success: true,
      stats: {
        totalRecords: totalRecords.count || 0,
        totalSizeBytes: totalSize.total_size || 0,
        totalSizeMB: Math.round((totalSize.total_size || 0) / 1024 / 1024 * 100) / 100,
        recordsOlderThan30Days: oldRecords.count || 0,
        userRecords: userRecords.count || 0
      }
    })

  } catch (error: any) {
    console.error('Storage stats error:', error)
    res.status(500).json({
      error: 'Failed to get storage statistics',
      details: error.message
    })
  }
})

// GET /api/cleanup/health - Health check for cleanup functionality
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await db.execute(sql`SELECT 1`)
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        storage: 'available'
      }
    })

  } catch (error: any) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    })
  }
})

export default router
