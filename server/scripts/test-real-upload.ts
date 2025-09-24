#!/usr/bin/env tsx
/**
 * Real Upload Test Script
 * 
 * Tests actual file upload scenarios to diagnose upload issues
 */

import { serverSupabase } from '../supabaseClient.js'
import { supabaseStorage } from '../lib/supabaseStorage.js'
import fs from 'fs'
import path from 'path'

async function main() {
  console.log('🧪 Testing real upload scenarios...\n')

  try {
    // Test 1: Direct Supabase storage upload with service role
    console.log('1️⃣ Testing direct storage upload with service role...')
    
    // Create a test 5MB file
    const testContent = Buffer.alloc(5 * 1024 * 1024, 'A') // 5MB of 'A' characters
    const testFileName = `test-5mb-${Date.now()}.txt`
    
    try {
      const { data, error } = await serverSupabase.storage
        .from('images')
        .upload(`user-uploads/${testFileName}`, testContent, {
          contentType: 'text/plain',
          upsert: true
        })

      if (error) {
        console.log(`   ❌ Storage upload failed: ${error.message}`)
        
        // Check for specific error types
        if (error.message.includes('row-level security')) {
          console.log(`   🔒 RLS policy is still blocking uploads!`)
        } else if (error.message.includes('413')) {
          console.log(`   📏 File size limit reached`)
        } else if (error.message.includes('timeout')) {
          console.log(`   ⏱️ Upload timeout`)
        } else {
          console.log(`   🔍 Unknown error type`)
        }
      } else {
        console.log(`   ✅ Storage upload successful: ${data.path}`)
        
        // Clean up
        await serverSupabase.storage
          .from('images')
          .remove([`user-uploads/${testFileName}`])
        console.log(`   🧹 Cleaned up test file`)
      }
    } catch (error: any) {
      console.log(`   💥 Exception during storage upload: ${error.message}`)
    }

    // Test 2: Using supabaseStorage wrapper
    console.log('\n2️⃣ Testing supabaseStorage wrapper...')
    
    try {
      const uploadResult = await supabaseStorage.uploadImageBuffer(
        testContent,
        'text/plain',
        {
          bucket: 'images',
          folder: 'user-uploads',
          fileName: `wrapper-test-${Date.now()}.txt`,
          makePublic: true
        }
      )

      if (!uploadResult.success) {
        console.log(`   ❌ Wrapper upload failed: ${uploadResult.error}`)
      } else {
        console.log(`   ✅ Wrapper upload successful: ${uploadResult.path}`)
        
        // Clean up if we have a path
        if (uploadResult.path) {
          await serverSupabase.storage
            .from('images')
            .remove([uploadResult.path])
          console.log(`   🧹 Cleaned up wrapper test file`)
        }
      }
    } catch (error: any) {
      console.log(`   💥 Exception during wrapper upload: ${error.message}`)
    }

    // Test 3: Check authentication status
    console.log('\n3️⃣ Checking authentication status...')
    
    try {
      // Test if we can list buckets (requires authentication)
      const { data: buckets, error: bucketError } = await serverSupabase.storage.listBuckets()
      
      if (bucketError) {
        console.log(`   ❌ Cannot list buckets: ${bucketError.message}`)
        console.log(`   🔑 This suggests authentication issues`)
      } else {
        console.log(`   ✅ Can list buckets: ${buckets?.length} found`)
        console.log(`   🔑 Authentication appears to be working`)
      }
    } catch (error: any) {
      console.log(`   💥 Exception checking buckets: ${error.message}`)
    }

    // Test 4: Check current environment variables
    console.log('\n4️⃣ Environment check...')
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY
    
    console.log(`   VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceKey ? '✅ Set' : '❌ Missing'}`)
    console.log(`   VITE_SUPABASE_ANON_KEY: ${anonKey ? '✅ Set' : '❌ Missing'}`)
    
    if (supabaseUrl) {
      console.log(`   URL: ${supabaseUrl}`)
    }

    // Test 5: Check if server is using the right client
    console.log('\n5️⃣ Checking which Supabase client is being used...')
    
    // This should show "Service Role Key" if configured correctly
    console.log(`   Client type: Using ${serviceKey ? 'Service Role Key' : 'Anonymous Key'}`)

    console.log('\n📋 POSSIBLE CAUSES OF 5MB UPLOAD FAILURE:')
    console.log('')
    console.log('🔸 If RLS error still occurs:')
    console.log('   - The SQL fix might not have been applied')
    console.log('   - Run the SQL script again in Supabase dashboard')
    console.log('')
    console.log('🔸 If timeout error:')
    console.log('   - Network connection issues')
    console.log('   - Supabase server issues')
    console.log('   - Try again in a few minutes')
    console.log('')
    console.log('🔸 If authentication error:')
    console.log('   - Service role key might be incorrect')
    console.log('   - Check environment variables')
    console.log('')
    console.log('🔸 If still getting 413 error:')
    console.log('   - Server might not have restarted')
    console.log('   - Try restarting your development server')
    console.log('')
    console.log('🔸 If other error:')
    console.log('   - Check the exact error message')
    console.log('   - Look at server logs for more details')

    console.log('\n✅ Upload diagnostic complete!')

  } catch (error: any) {
    console.error('❌ Error during upload test:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
