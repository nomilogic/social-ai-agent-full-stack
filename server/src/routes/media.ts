import express, { Request, Response } from 'express'
import multer from 'multer'
import { serverSupabase } from '../supabaseClient'
import { validateRequestBody } from '../middleware/auth'

const router = express.Router()

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images and videos
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'))
    }
  }
})

// POST /api/media/upload - Upload media file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  const userId = req.body.userId
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' })
  }

  try {
    const file = req.file
    const fileExt = file.originalname.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    // Upload file to Supabase Storage
    const { data, error } = await serverSupabase.storage
      .from('media')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        duplex: 'half'
      })

    if (error) {
      console.error('Error uploading media:', error)
      return res.status(500).json({ error: error.message })
    }

    // Get public URL
    const { data: { publicUrl } } = serverSupabase.storage
      .from('media')
      .getPublicUrl(fileName)

    res.json({ 
      success: true, 
      data: {
        url: publicUrl,
        fileName: fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      }
    })
  } catch (err: any) {
    console.error('Server error uploading media:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/media/:userId - Get all media files for a user
router.get('/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId

  try {
    const { data, error } = await serverSupabase.storage
      .from('media')
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('Error listing media:', error)
      return res.status(500).json({ error: error.message })
    }

    // Get public URLs for all files
    const filesWithUrls = data.map(file => {
      const { data: { publicUrl } } = serverSupabase.storage
        .from('media')
        .getPublicUrl(`${userId}/${file.name}`)

      return {
        name: file.name,
        url: publicUrl,
        size: file.metadata?.size,
        lastModified: file.updated_at,
        createdAt: file.created_at
      }
    })

    res.json({ success: true, data: filesWithUrls })
  } catch (err: any) {
    console.error('Server error listing media:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/media/:userId/:fileName - Delete a media file
router.delete('/:userId/:fileName', async (req: Request, res: Response) => {
  const { userId, fileName } = req.params
  const requestUserId = req.query.userId as string

  // Ensure the requesting user matches the file owner
  if (userId !== requestUserId) {
    return res.status(403).json({ error: 'Unauthorized to delete this file' })
  }

  try {
    const { error } = await serverSupabase.storage
      .from('media')
      .remove([`${userId}/${fileName}`])

    if (error) {
      console.error('Error deleting media:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({ success: true, message: 'File deleted successfully' })
  } catch (err: any) {
    console.error('Server error deleting media:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
