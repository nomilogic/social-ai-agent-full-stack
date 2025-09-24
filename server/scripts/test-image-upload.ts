#!/usr/bin/env tsx
/**
 * Image Upload Test Script
 * 
 * Tests uploading the specific image file provided by the user
 */

import { serverSupabase } from '../supabaseClient.js'
import { supabaseStorage } from '../lib/supabaseStorage.js'
import fs from 'fs'
import path from 'path'
import FormData from 'form-data'
import axios from 'axios'

async function main() {
  console.log('🖼️ Testing image file upload...\n')

  // First, let's check if the image file exists in the project directory
  const possiblePaths = [
    path.join(process.cwd(), 'test.png'),
    path.join(process.cwd(), 'test-image.jpg'),
    path.join(process.cwd(), 'image.jpg'),
    path.join(process.cwd(), 'upload.jpg'),
    path.join(process.cwd(), 'test.jpg'),
    path.join(process.cwd(), 'test-image.png'),
    path.join(process.cwd(), 'image.png')
  ]

  let imageBuffer: Buffer | null = null
  let imagePath: string | null = null
  let imageSize = 0

  // Look for the image file
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      imagePath = testPath
      imageBuffer = fs.readFileSync(testPath)
      imageSize = imageBuffer.length
      console.log(`📁 Found image at: ${testPath}`)
      console.log(`📏 Image size: ${(imageSize / (1024 * 1024)).toFixed(2)} MB`)
      break
    }
  }

  if (!imageBuffer || !imagePath) {
    console.log('❌ No image file found. Please save the image as one of these names in the project root:')
    console.log('   - test-image.jpg')
    console.log('   - image.jpg') 
    console.log('   - upload.jpg')
    console.log('   - test.jpg')
    return
  }

  try {
    // Test 1: Direct Supabase storage upload
    console.log('\n1️⃣ Testing direct Supabase storage upload...')
    
    // Detect file extension and content type
    const fileExt = imagePath.toLowerCase().endsWith('.png') ? 'png' : 'jpg'
    const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg'
    const fileName = `test-car-image-${Date.now()}.${fileExt}`
    const uploadPath = `user-uploads/${fileName}`

    try {
      const { data, error } = await serverSupabase.storage
        .from('images')
        .upload(uploadPath, imageBuffer, {
          contentType: contentType,
          upsert: true
        })

      if (error) {
        console.log(`   ❌ Direct upload failed: ${error.message}`)
        
        // Detailed error analysis
        if (error.message.includes('row-level security')) {
          console.log('   🔒 RLS policy blocking upload')
        } else if (error.message.includes('413') || error.message.includes('too large')) {
          console.log(`   📏 File too large (${(imageSize / (1024 * 1024)).toFixed(2)} MB)`)
        } else if (error.message.includes('timeout')) {
          console.log('   ⏱️ Upload timeout')
        } else if (error.message.includes('auth')) {
          console.log('   🔑 Authentication issue')
        }
      } else {
        console.log(`   ✅ Direct upload successful!`)
        console.log(`   📂 Path: ${data.path}`)
        console.log(`   🔗 Full path: ${data.fullPath}`)

        // Get public URL
        const { data: publicUrlData } = serverSupabase.storage
          .from('images')
          .getPublicUrl(uploadPath)
        
        console.log(`   🌐 Public URL: ${publicUrlData.publicUrl}`)

        // Clean up
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait a second
        await serverSupabase.storage
          .from('images')
          .remove([uploadPath])
        console.log('   🧹 Cleaned up test file')
      }
    } catch (error: any) {
      console.log(`   💥 Exception during direct upload: ${error.message}`)
    }

    // Test 2: Using supabaseStorage wrapper
    console.log('\n2️⃣ Testing supabaseStorage wrapper...')
    
    try {
      const wrapperFileName = `wrapper-car-${Date.now()}.${fileExt}`
      const uploadResult = await supabaseStorage.uploadImageBuffer(
        imageBuffer,
        contentType,
        {
          bucket: 'images',
          folder: 'user-uploads',
          fileName: wrapperFileName,
          makePublic: true
        }
      )

      if (!uploadResult.success) {
        console.log(`   ❌ Wrapper upload failed: ${uploadResult.error}`)
      } else {
        console.log(`   ✅ Wrapper upload successful!`)
        console.log(`   📂 Path: ${uploadResult.path}`)
        console.log(`   🔗 URL: ${uploadResult.url}`)
        
        // Clean up
        if (uploadResult.path) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          await serverSupabase.storage
            .from('images')
            .remove([uploadResult.path])
          console.log('   🧹 Cleaned up wrapper test file')
        }
      }
    } catch (error: any) {
      console.log(`   💥 Exception during wrapper upload: ${error.message}`)
    }

    // Test 3: Test via HTTP endpoint (if server is running)
    console.log('\n3️⃣ Testing via HTTP endpoint...')
    
    try {
      const formData = new FormData()
      formData.append('media', imageBuffer, {
        filename: `test-car.${fileExt}`,
        contentType: contentType
      })

      // Try localhost:3001 (typical backend port)
      const response = await axios.post('http://localhost:3001/api/media/upload', formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync()
        },
        timeout: 30000, // 30 second timeout
        maxContentLength: 200 * 1024 * 1024, // 200MB max
        maxBodyLength: 200 * 1024 * 1024
      })

      console.log(`   ✅ HTTP upload successful!`)
      console.log(`   📊 Status: ${response.status}`)
      console.log(`   📝 Response:`, response.data)

    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        console.log('   ⚠️ Server not running on localhost:3001')
        console.log('   💡 Start your server first to test HTTP endpoint')
      } else if (error.response) {
        console.log(`   ❌ HTTP upload failed: ${error.response.status} ${error.response.statusText}`)
        console.log(`   📝 Error response:`, error.response.data)
        
        if (error.response.status === 413) {
          console.log('   📏 413 Request Entity Too Large - file size limit exceeded')
        }
      } else {
        console.log(`   💥 HTTP request exception: ${error.message}`)
      }
    }

    // Test 4: Environment and configuration check
    console.log('\n4️⃣ Configuration check...')
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log(`   🔗 Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
    console.log(`   🔑 Service Role Key: ${serviceKey ? '✅ Set' : '❌ Missing'}`)
    console.log(`   📏 Image size: ${(imageSize / (1024 * 1024)).toFixed(2)} MB`)
    
    if (serviceKey) {
      console.log(`   🔐 Using Service Role authentication`)
    } else {
      console.log(`   ⚠️ No Service Role key - using anonymous access`)
    }

    console.log('\n📋 NEXT STEPS:')
    console.log('')
    if (imageSize > 50 * 1024 * 1024) {
      console.log('🔸 Image is larger than 50MB - make sure server multer limit is increased')
      console.log('   - Restart your development server after increasing limits')
    }
    console.log('🔸 If uploads work here but not in your app:')
    console.log('   - Check client-side code for errors')
    console.log('   - Verify the client is hitting the correct endpoint')
    console.log('   - Check browser developer console for errors')
    console.log('🔸 If still getting errors:')
    console.log('   - Check server logs while attempting upload')
    console.log('   - Verify server is running and accessible')

  } catch (error: any) {
    console.error('❌ Error during image upload test:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
