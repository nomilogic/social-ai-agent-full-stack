import { serverSupabase } from '../supabaseClient.js'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

export interface UploadImageOptions {
  bucket?: string
  folder?: string
  fileName?: string
  makePublic?: boolean
  // If provided, create a signed URL that expires after this many seconds (defaults to 24h)
  signedUrlExpiresInSeconds?: number
}

export interface UploadResult {
  success: boolean
  url?: string // Prefer signedUrl if available, otherwise publicUrl
  publicUrl?: string
  signedUrl?: string
  path?: string
  error?: string
}

// Default bucket name for images (matches existing Supabase bucket)
const DEFAULT_BUCKET = 'images'
const DEFAULT_FOLDER = 'ai-generated'

export class SupabaseStorageManager {
  
  /**
   * Upload an image from URL to Supabase Storage
   */
  async uploadImageFromUrl(
    imageUrl: string, 
    options: UploadImageOptions = {}
  ): Promise<UploadResult> {
    try {
      console.log('Uploading image to Supabase from URL:', imageUrl)
      
      const bucket = options.bucket || DEFAULT_BUCKET
      const folder = options.folder || DEFAULT_FOLDER
      const fileName = options.fileName || `${uuidv4()}.png`
      const makePublic = options.makePublic !== false // Default to true
      
      // Download the image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
        headers: {
          'User-Agent': 'S-AI-Bot/1.0'
        }
      })
      
      console.log('Downloaded image, size:', response.data.byteLength, 'bytes')
      
      // Determine file extension from content type or URL
      const contentType = response.headers['content-type'] || 'image/png'
      const extension = this.getFileExtension(contentType, imageUrl)
      const finalFileName = fileName.includes('.') ? fileName : `${fileName}${extension}`
      
      const filePath = folder ? `${folder}/${finalFileName}` : finalFileName
      
      // Upload to Supabase Storage
      const { data, error } = await serverSupabase.storage
        .from(bucket)
        .upload(filePath, response.data, {
          contentType,
          upsert: true // Allow overwriting existing files
        })
      
      if (error) {
        console.error('Supabase upload error:', error)
        return {
          success: false,
          error: `Supabase upload failed: ${error.message}`
        }
      }
      
      console.log('Successfully uploaded to Supabase:', data.path)
      
      // Get public URL (works if bucket is public) - prioritize for social media
      const { data: publicUrlData } = serverSupabase.storage
        .from(bucket)
        .getPublicUrl(data.path)
      const publicUrl = publicUrlData.publicUrl
      if (publicUrl) {
        console.log('Public URL (preferred for social media):', publicUrl)
      }

      // Only create signed URL if specifically requested (not for social media)
      let signedUrl: string | undefined
      if (options.signedUrlExpiresInSeconds) {
        const expiresIn = options.signedUrlExpiresInSeconds
        try {
          const { data: signedData, error: signedErr } = await serverSupabase.storage
            .from(bucket)
            .createSignedUrl(data.path, expiresIn)
          if (signedErr) {
            console.warn('Could not create signed URL, will use public URL:', signedErr)
          } else {
            signedUrl = signedData?.signedUrl
            if (signedUrl) {
              console.log('Signed URL (expiring):', signedUrl)
            }
          }
        } catch (e) {
          console.warn('Error while creating signed URL, will use public URL:', e)
        }
      }
      
      return {
        success: true,
        url: publicUrl, // Always prefer public URL for social media compatibility
        publicUrl,
        signedUrl,
        path: data.path
      }
      
    } catch (error: any) {
      console.error('Error uploading image to Supabase:', error)
      return {
        success: false,
        error: `Upload failed: ${error.message || 'Unknown error'}`
      }
    }
  }
  
  /**
   * Upload an image buffer to Supabase Storage
   */
  async uploadImageBuffer(
    buffer: Buffer,
    contentType: string,
    options: UploadImageOptions = {}
  ): Promise<UploadResult> {
    try {
      console.log('Uploading image buffer to Supabase, size:', buffer.length, 'bytes')
      
      const bucket = options.bucket || DEFAULT_BUCKET
      const folder = options.folder || DEFAULT_FOLDER
      const fileName = options.fileName || `${uuidv4()}.png`
      
      const extension = this.getFileExtension(contentType)
      const finalFileName = fileName.includes('.') ? fileName : `${fileName}${extension}`
      
      const filePath = folder ? `${folder}/${finalFileName}` : finalFileName
      
      // Upload to Supabase Storage
      const { data, error } = await serverSupabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType,
          upsert: true
        })
      
      if (error) {
        console.error('Supabase upload error:', error)
        return {
          success: false,
          error: `Supabase upload failed: ${error.message}`
        }
      }
      
      console.log('Successfully uploaded buffer to Supabase:', data.path)
      
      // Attempt to create a signed (expiring) URL first
      const expiresIn = options.signedUrlExpiresInSeconds ?? 60 * 60 * 24 // 24h by default
      let signedUrl: string | undefined
      try {
        const { data: signedData, error: signedErr } = await serverSupabase.storage
          .from(bucket)
          .createSignedUrl(data.path, expiresIn)
        if (signedErr) {
          console.warn('Could not create signed URL, will fall back to public URL:', signedErr)
        } else {
          signedUrl = signedData?.signedUrl
          if (signedUrl) {
            console.log('Signed URL (expiring):', signedUrl)
          }
        }
      } catch (e) {
        console.warn('Error while creating signed URL, will fall back to public URL:', e)
      }

      // Get public URL (works if bucket is public)
      const { data: publicUrlData } = serverSupabase.storage
        .from(bucket)
        .getPublicUrl(data.path)
      const publicUrl = publicUrlData.publicUrl
      if (publicUrl) {
        console.log('Public URL:', publicUrl)
      }
      
      return {
        success: true,
        url: signedUrl || publicUrl,
        publicUrl,
        signedUrl,
        path: data.path
      }
      
    } catch (error: any) {
      console.error('Error uploading buffer to Supabase:', error)
      return {
        success: false,
        error: `Upload failed: ${error.message || 'Unknown error'}`
      }
    }
  }
  
  /**
   * Delete an image from Supabase Storage
   */
  async deleteImage(filePath: string, bucket: string = DEFAULT_BUCKET): Promise<boolean> {
    try {
      const { error } = await serverSupabase.storage
        .from(bucket)
        .remove([filePath])
      
      if (error) {
        console.error('Error deleting image:', error)
        return false
      }
      
      console.log('Successfully deleted image:', filePath)
      return true
      
    } catch (error) {
      console.error('Error deleting image:', error)
      return false
    }
  }
  
  /**
   * List images in a folder
   */
  async listImages(folder: string = DEFAULT_FOLDER, bucket: string = DEFAULT_BUCKET) {
    try {
      const { data, error } = await serverSupabase.storage
        .from(bucket)
        .list(folder)
      
      if (error) {
        console.error('Error listing images:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error listing images:', error)
      return []
    }
  }
  
  /**
   * Ensure bucket exists, create if it doesn't
   */
  async ensureBucketExists(bucket: string = DEFAULT_BUCKET): Promise<boolean> {
    try {
      // Try to get bucket info
      const { data, error } = await serverSupabase.storage.getBucket(bucket)
      
      if (error && error.message.includes('not found')) {
        // Bucket doesn't exist, create it
        console.log(`Creating bucket: ${bucket}`)
        const { error: createError } = await serverSupabase.storage.createBucket(bucket, {
          public: true, // Make bucket public for easy access
          allowedMimeTypes: ['image/*'], // Only allow images
          fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
        })
        
        if (createError) {
          console.error('Error creating bucket:', createError)
          return false
        }
        
        console.log(`Successfully created bucket: ${bucket}`)
        return true
      } else if (error) {
        console.error('Error checking bucket:', error)
        return false
      }
      
      // Bucket exists
      console.log(`Bucket ${bucket} already exists`)
      return true
      
    } catch (error) {
      console.error('Error ensuring bucket exists:', error)
      return false
    }
  }
  
  /**
   * Download media from Supabase storage using authenticated access
   */
  async downloadMediaFromStorage(mediaUrl: string): Promise<Buffer | null> {
    try {
      console.log('Downloading media from Supabase storage:', mediaUrl)
      
      // Check if this is a Supabase storage URL
      if (!mediaUrl.includes('supabase.co/storage/v1/object/public/')) {
        console.log('Not a Supabase storage URL, using direct download')
        const response = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          timeout: 120000, // 2 minutes timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        return Buffer.from(response.data)
      }
      
      // Extract bucket and path from Supabase URL
      const supabasePattern = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)/
      const match = mediaUrl.match(supabasePattern)
      
      if (!match || !match[1] || !match[2]) {
        throw new Error('Could not parse Supabase storage URL')
      }
      
      const bucket = match[1]
      const path = match[2]
      
      console.log(`Downloading from bucket: ${bucket}, path: ${path}`)
      
      // Try multiple approaches for maximum compatibility
      let buffer: Buffer | null = null
      
      // Method 1: Try downloading with service role (preferred)
      try {
        const { data, error } = await serverSupabase.storage
          .from(bucket)
          .download(path)
        
        if (!error && data) {
          const arrayBuffer = await data.arrayBuffer()
          buffer = Buffer.from(arrayBuffer)
          console.log('Successfully downloaded via service role, size:', buffer.length, 'bytes')
          return buffer
        } else {
          console.warn('Service role download failed:', error?.message || 'No data')
        }
      } catch (serviceError: any) {
        console.warn('Service role download error:', serviceError.message)
      }
      
      // Method 2: Fallback to direct HTTP download (for public files)
      try {
        console.log('Trying direct HTTP download as fallback...')
        const response = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          timeout: 120000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*'
          }
        })
        
        buffer = Buffer.from(response.data)
        console.log('Successfully downloaded via direct HTTP, size:', buffer.length, 'bytes')
        return buffer
        
      } catch (httpError: any) {
        console.error('Direct HTTP download also failed:', httpError.message)
      }
      
      // Method 3: Try creating a signed URL and downloading from that
      try {
        console.log('Trying signed URL approach...')
        const { data: signedData, error: signedError } = await serverSupabase.storage
          .from(bucket)
          .createSignedUrl(path, 3600) // 1 hour expiry
        
        if (!signedError && signedData?.signedUrl) {
          const response = await axios.get(signedData.signedUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })
          
          buffer = Buffer.from(response.data)
          console.log('Successfully downloaded via signed URL, size:', buffer.length, 'bytes')
          return buffer
        }
      } catch (signedError: any) {
        console.warn('Signed URL download failed:', signedError.message)
      }
      
      throw new Error('All download methods failed')
      
    } catch (error: any) {
      console.error('Error downloading media from storage:', error.message)
      return null
    }
  }

  /**
   * Get file extension from content type or URL
   */
  private getFileExtension(contentType: string, url?: string): string {
    // Try to get extension from content type
    const typeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',  
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov'
    }
    
    if (typeMap[contentType]) {
      return typeMap[contentType]
    }
    
    // Try to get extension from URL
    if (url) {
      const urlExt = url.split('.').pop()?.toLowerCase()
      if (urlExt && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(urlExt)) {
        return `.${urlExt}`
      }
    }
    
    // Default to PNG
    return '.png'
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorageManager()

// Export utility functions for common operations
export async function uploadImageFromUrl(url: string, options?: UploadImageOptions): Promise<UploadResult> {
  return supabaseStorage.uploadImageFromUrl(url, options)
}

export async function uploadImageBuffer(buffer: Buffer, contentType: string, options?: UploadImageOptions): Promise<UploadResult> {
  return supabaseStorage.uploadImageBuffer(buffer, contentType, options)
}

export async function ensureStorageSetup(): Promise<boolean> {
  return supabaseStorage.ensureBucketExists()
}

export async function downloadMediaFromStorage(mediaUrl: string): Promise<Buffer | null> {
  return supabaseStorage.downloadMediaFromStorage(mediaUrl)
}

// Helper function to delete image by URL path
export async function deleteImageByUrl(imageUrl: string, bucket: string = DEFAULT_BUCKET): Promise<boolean> {
  try {
    // Extract path from Supabase URL
    const supabasePattern = /\/storage\/v1\/object\/public\/[^/]+\/(.+)/
    const match = imageUrl.match(supabasePattern)
    
    if (!match || !match[1]) {
      console.warn('Cannot extract path from URL for cleanup:', imageUrl)
      return false
    }
    
    const filePath = match[1]
    console.log('🗑️ Cleaning up image from Supabase:', filePath)
    
    return supabaseStorage.deleteImage(filePath, bucket)
  } catch (error) {
    console.error('Error in cleanup function:', error)
    return false
  }
}

// Helper function to extract Supabase path from URL
export function extractSupabasePathFromUrl(imageUrl: string): string | null {
  try {
    const supabasePattern = /\/storage\/v1\/object\/public\/[^/]+\/(.+)/
    const match = imageUrl.match(supabasePattern)
    return match ? match[1] : null
  } catch (error) {
    console.error('Error extracting path from URL:', error)
    return null
  }
}
