import express, { Request, Response } from 'express'
import multer from 'multer'
import { authenticateJWT, validateRequestBody } from '../middleware/auth'
import path from 'path'
import fs from 'fs'
import { db } from '../db'
import { media } from '../../shared/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { serverSupabaseAnon as serverSupabase } from '../supabaseClient'
import { supabaseStorage } from '../lib/supabaseStorage'

const router = express.Router()

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit (increased for video uploads)
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

// UUID validation helper
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// POST /api/media/upload - Upload media file (JWT protected)
router.post('/upload', authenticateJWT, upload.single('file'), async (req: Request, res: Response) => {
  // Get user ID from JWT token instead of request body
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ error: 'User authentication required' })
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' })
  }

  try {
    const file = req.file
    const fileExt = file.originalname.split('.').pop()
    const fileName = `${userId}_${Date.now()}.${fileExt}`

    console.log('📤 Uploading media file to Supabase:', fileName)
    
    // Upload to Supabase storage instead of local storage
    const uploadResult = await supabaseStorage.uploadImageBuffer(
      file.buffer,
      file.mimetype,
      {
        bucket: 'images',
        folder: 'user-uploads',
        fileName: fileName,
        makePublic: true // Ensure it's publicly accessible for Facebook posts
      }
    )

    if (!uploadResult.success) {
      console.error('❌ Failed to upload to Supabase:', uploadResult.error)
      return res.status(500).json({ 
        error: 'Failed to upload file to storage', 
        details: uploadResult.error 
      })
    }

    const publicUrl = uploadResult.publicUrl || uploadResult.url
    console.log('✅ Successfully uploaded to Supabase:', publicUrl)

    // Save media record to database with Supabase URL
    await db.insert(media).values({
      id: crypto.randomUUID(),
      user_id: userId,
      filename: fileName,
      original_name: file.originalname,
      file_path: publicUrl, // Use Supabase public URL
      file_url: publicUrl, // Also store in file_url field
      mime_type: file.mimetype,
      file_size: file.size,
      media_type: file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'other',
      created_at: new Date(),
      updated_at: new Date()
    })

    console.log('💾 Media record saved to database')

    res.json({ 
      success: true, 
      data: {
        url: publicUrl, // Return Supabase public URL
        fileName: fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        supabasePath: uploadResult.path
      }
    })
  } catch (err: any) {
    console.error('❌ Server error uploading media:', err)
    res.status(500).json({ error: 'Internal server error', details: err.message })
  }
})

// GET /api/media/:userId - Get all media files for a user
router.get('/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId

  try {
    const mediaFiles = await db.select().from(media).where(eq(media.user_id, userId))

    const filesWithUrls = mediaFiles.map((file) => {
      return {
        name: file.filename,
        url: file.file_path,
        size: file.file_size,
        lastModified: file.updated_at,
        createdAt: file.created_at,
        originalName: file.original_name,
        mimeType: file.mime_type
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
    const mediaRecord = await db.select().from(media).where(eq(media.filename, fileName)).limit(1)

    if (mediaRecord.length === 0) {
      return res.status(404).json({ error: 'File not found' })
    }

    const record = mediaRecord[0]
    console.log('🗑️ Deleting media file:', fileName)

    // Delete from database first
    await db.delete(media).where(eq(media.filename, fileName))
    console.log('💾 Deleted media record from database')

    // Delete from Supabase storage if it's a Supabase URL
    if (record.file_path && record.file_path.includes('supabase.co/storage/v1/object/public/')) {
      try {
        // Extract path from Supabase URL and delete
        const supabasePattern = /\/storage\/v1\/object\/public\/[^/]+\/(.+)/
        const match = record.file_path.match(supabasePattern)
        
        if (match && match[1]) {
          const filePath = match[1]
          console.log('🗑️ Deleting from Supabase storage:', filePath)
          const deleted = await supabaseStorage.deleteImage(filePath)
          if (deleted) {
            console.log('✅ Successfully deleted from Supabase storage')
          } else {
            console.warn('⚠️ Could not delete from Supabase storage, but database record removed')
          }
        }
      } catch (storageError) {
        console.warn('⚠️ Error deleting from Supabase storage:', storageError)
        // Continue anyway - database record is already deleted
      }
    } else {
      // Fallback: try to delete from local storage (for backward compatibility)
      const localFilePath = path.join(process.cwd(), 'public', 'uploads', fileName)
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath)
        console.log('✅ Deleted local file:', localFilePath)
      }
    }

    res.json({ success: true, message: 'File deleted successfully' })
  } catch (err: any) {
    console.error('❌ Server error deleting media:', err)
    res.status(500).json({ error: 'Internal server error', details: err.message })
  }
})

// POST /api/media/generate-thumbnail - Generate thumbnail for video URL (JWT protected)
router.post('/generate-thumbnail', authenticateJWT, async (req: Request, res: Response) => {
  const { videoUrl } = req.body
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ error: 'User authentication required' })
  }

  if (!videoUrl) {
    return res.status(400).json({ error: 'Video URL is required' })
  }

  try {
    console.log('📹 Generating thumbnail for video:', videoUrl)
    
    // Download video from storage
    const videoBuffer = await supabaseStorage.downloadMediaFromStorage(videoUrl)
    
    if (!videoBuffer) {
      return res.status(400).json({ error: 'Could not download video from storage' })
    }
    
    // For now, we'll return a placeholder thumbnail URL
    // In a full implementation, you'd use ffmpeg or similar to extract frame
    const thumbnailFileName = `${userId}_thumbnail_${Date.now()}.jpg`
    
    // Upload placeholder thumbnail (in real implementation, extract actual frame)
    const placeholderThumbnail = Buffer.from(
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
    )
    
    const uploadResult = await supabaseStorage.uploadImageBuffer(
      placeholderThumbnail,
      'image/jpeg',
      {
        bucket: 'images',
        folder: 'thumbnails',
        fileName: thumbnailFileName,
        makePublic: true
      }
    )
    
    if (!uploadResult.success) {
      return res.status(500).json({ error: 'Failed to upload thumbnail' })
    }
    
    res.json({
      success: true,
      thumbnailUrl: uploadResult.publicUrl || uploadResult.url
    })
    
  } catch (error: any) {
    console.error('Error generating thumbnail:', error)
    res.status(500).json({ error: 'Failed to generate thumbnail', details: error.message })
  }
})

// GET /api/media/proxy/:bucketName/* - Proxy Supabase storage files with authentication
router.get('/proxy/:bucketName/*', async (req: Request, res: Response) => {
  const bucketName = req.params.bucketName
  const filePath = req.params[0] // Everything after the bucket name
  
  try {
    console.log(`📥 Proxying media from bucket: ${bucketName}, path: ${filePath}`)
    
    // Download from Supabase using service role
    const { data, error } = await serverSupabase.storage
      .from(bucketName)
      .download(filePath)
    
    if (error) {
      console.error('Supabase download error:', error)
      return res.status(404).json({ error: 'File not found' })
    }
    
    if (!data) {
      return res.status(404).json({ error: 'No data received' })
    }
    
    // Convert blob to buffer
    const arrayBuffer = await data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Determine content type based on file extension
    const ext = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg'
    else if (ext === 'png') contentType = 'image/png'
    else if (ext === 'gif') contentType = 'image/gif'
    else if (ext === 'webp') contentType = 'image/webp'
    else if (ext === 'mp4') contentType = 'video/mp4'
    else if (ext === 'webm') contentType = 'video/webm'
    else if (ext === 'mov') contentType = 'video/quicktime'
    
    // Set headers
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', buffer.length)
    res.setHeader('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    
    // Send the file
    res.send(buffer)
    
  } catch (error: any) {
    console.error('Error proxying media:', error)
    res.status(500).json({ error: 'Failed to proxy media file' })
  }
})

export default router
