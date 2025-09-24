#!/usr/bin/env tsx
/**
 * File Size Limits Diagnostic Script
 * 
 * Checks and displays all file size limits in your application
 */

import { serverSupabase } from '../supabaseClient.js'

async function main() {
  console.log('📏 Checking file size limits...\n')

  try {
    // 1. Check Supabase storage bucket configuration
    console.log('1️⃣ Checking Supabase bucket limits...')
    
    try {
      const { data: buckets, error } = await serverSupabase.storage.listBuckets()
      
      if (buckets) {
        for (const bucket of buckets) {
          console.log(`   📦 Bucket: ${bucket.name}`)
          console.log(`      Public: ${bucket.public}`)
          console.log(`      File size limit: ${bucket.file_size_limit ? `${Math.round(bucket.file_size_limit / (1024 * 1024))} MB` : 'No limit set'}`)
          console.log(`      Allowed MIME types: ${bucket.allowed_mime_types || 'All types'}`)
        }
      }
    } catch (error: any) {
      console.log(`   ⚠️ Could not check bucket limits: ${error.message}`)
    }

    // 2. Check application limits
    console.log('\n2️⃣ Application limits (from code):')
    console.log('   📁 Multer limit (server/routes/media.ts): 50 MB')
    console.log('   🎯 Default bucket creation limit: 10 MB')

    // 3. Check Supabase project limits
    console.log('\n3️⃣ Supabase project limits:')
    console.log('   📊 Free tier: 1 GB total storage')
    console.log('   📎 Default file upload limit: 50 MB')
    console.log('   🔧 Pro tier: Up to 100 GB storage')

    // 4. Common file size recommendations
    console.log('\n4️⃣ Recommended file sizes:')
    console.log('   🖼️ Images: < 5 MB (optimal < 2 MB)')
    console.log('   🎥 Videos: < 100 MB (optimal < 50 MB)')
    console.log('   📱 Social media images: < 1 MB')
    console.log('   🎬 Social media videos: < 25 MB')

    // 5. Troubleshooting steps
    console.log('\n🔧 TROUBLESHOOTING 413 ERROR:')
    console.log('')
    console.log('If you\'re getting "413 Request Entity Too Large":')
    console.log('')
    console.log('✅ Check file size:')
    console.log('   - Reduce image quality/resolution')
    console.log('   - Compress video files')
    console.log('   - Use tools like TinyPNG for images')
    console.log('')
    console.log('✅ Increase limits if needed:')
    console.log('   1. Update multer limit in server/routes/media.ts')
    console.log('   2. Update Supabase bucket limits')
    console.log('   3. Check nginx/proxy limits if using reverse proxy')
    console.log('')
    console.log('✅ Current limits to check:')
    console.log('   - Your file: How big is it?')
    console.log('   - Multer: 50 MB (server/routes/media.ts line 19)')
    console.log('   - Supabase bucket: Check in dashboard')
    console.log('   - Browser: ~2 GB theoretical limit')

    console.log('\n📋 IMMEDIATE FIXES:')
    console.log('')
    console.log('🔸 Option 1: Reduce file size')
    console.log('   - Compress your image/video before uploading')
    console.log('   - Recommended: < 10 MB for most files')
    console.log('')
    console.log('🔸 Option 2: Increase limits')
    console.log('   - Edit server/routes/media.ts line 19')
    console.log('   - Change: fileSize: 50 * 1024 * 1024 to higher value')
    console.log('   - Example: fileSize: 100 * 1024 * 1024 (100 MB)')

    console.log('\n✅ File size diagnostic complete!')

  } catch (error: any) {
    console.error('❌ Error during file size check:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
