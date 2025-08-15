import express, { Request, Response } from 'express'
import multer from 'multer'
import { authenticateToken, AuthRequest, validateRequestBody } from '../middleware/auth'
import path from 'path'
import fs from 'fs'
import { db } from '../db'
import { media } from '../../shared/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { serverSupabaseAnon as serverSupabase } from '../supabaseClient'

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
    const fileName = `${userId}_${Date.now()}.${fileExt}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Save file to public/uploads directory
    const filePath = path.join(uploadsDir, fileName)
    fs.writeFileSync(filePath, file.buffer)

    // Create public URL for the uploaded file
    const publicUrl = `/uploads/${fileName}`

    // Save media record to database
    await db.insert(media).values({
      id: crypto.randomUUID(),
      userId,
      fileName,
      originalName: file.originalname,
      filePath: publicUrl,
      mimeType: file.mimetype,
      size: file.size,
      createdAt: new Date(),
      updatedAt: new Date()
    })

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
    const mediaFiles = await db.select().from(media).where(eq(media.userId, userId))

    const filesWithUrls = mediaFiles.map((file) => {
      return {
        name: file.fileName,
        url: file.filePath,
        size: file.size,
        lastModified: file.updatedAt,
        createdAt: file.createdAt,
        originalName: file.originalName,
        mimeType: file.mimeType
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
    // Find the media record in the database
    const mediaRecord = await db.select().from(media).where(eq(media.fileName, fileName)).limit(1)

    if (mediaRecord.length === 0) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Delete from database
    await db.delete(media).where(eq(media.fileName, fileName))

    // Delete physical file
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    res.json({ success: true, message: 'File deleted successfully' })
  } catch (err: any) {
    console.error('Server error deleting media:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router