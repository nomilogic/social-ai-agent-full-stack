#!/usr/bin/env tsx
/**
 * Simple Storage Diagnostic Script
 * 
 * This script performs basic checks to diagnose Supabase storage connectivity
 */

import { serverSupabase } from '../supabaseClient.js'

async function main() {
  console.log('🔍 Running Supabase Storage Diagnostics...\n')
  
  // Step 1: Check if we can list buckets
  console.log('1️⃣ Testing bucket listing...')
  try {
    const { data: buckets, error } = await serverSupabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ Error listing buckets:', error.message)
      console.log('   This usually means:')
      console.log('   - Missing or invalid SUPABASE_SERVICE_ROLE_KEY')
      console.log('   - Network connectivity issues')
      console.log('   - Supabase project is paused or deleted')
    } else {
      console.log('✅ Successfully connected to storage!')
      console.log(`   Found ${buckets?.length || 0} buckets:`)
      buckets?.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
      })
    }
  } catch (error: any) {
    console.error('❌ Exception during bucket listing:', error.message)
  }
  
  // Step 2: Test access to 'images' bucket specifically
  console.log('\n2️⃣ Testing access to images bucket...')
  try {
    const { data: files, error } = await serverSupabase.storage
      .from('images')
      .list('', { limit: 10 })
    
    if (error) {
      console.error('❌ Error accessing images bucket:', error.message)
      if (error.message.includes('not found')) {
        console.log('   The "images" bucket does not exist yet.')
        console.log('   This is normal for new projects.')
      }
    } else {
      console.log('✅ Successfully accessed images bucket!')
      console.log(`   Found ${files?.length || 0} items in root folder`)
      
      if (files && files.length > 0) {
        let totalSize = 0
        files.forEach(file => {
          if (file.metadata?.size) {
            totalSize += file.metadata.size
          }
          console.log(`   - ${file.name} (${file.metadata?.size ? `${Math.round(file.metadata.size / 1024)} KB` : 'unknown size'})`)
        })
        console.log(`   Total size of listed files: ${Math.round(totalSize / 1024)} KB`)
      }
    }
  } catch (error: any) {
    console.error('❌ Exception accessing images bucket:', error.message)
  }
  
  // Step 3: Check database connectivity
  console.log('\n3️⃣ Testing database connectivity...')
  try {
    // Simple query to test database connection
    const result = await serverSupabase.from('media').select('count(*)', { count: 'exact', head: true })
    
    if (result.error) {
      console.error('❌ Database error:', result.error.message)
      if (result.error.message.includes('relation "media" does not exist')) {
        console.log('   The media table does not exist yet.')
        console.log('   Run database migrations to create it.')
      }
    } else {
      console.log('✅ Database connection successful!')
      console.log(`   Media table has ${result.count || 0} records`)
    }
  } catch (error: any) {
    console.error('❌ Exception during database test:', error.message)
  }
  
  // Step 4: Environment check
  console.log('\n4️⃣ Environment variables check...')
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const dbUrl = process.env.DATABASE_URL
  
  console.log(`   VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceKey ? '✅ Set' : '❌ Missing'}`)
  console.log(`   VITE_SUPABASE_ANON_KEY: ${anonKey ? '✅ Set' : '❌ Missing'}`)
  console.log(`   DATABASE_URL: ${dbUrl ? '✅ Set' : '❌ Missing'}`)
  
  if (supabaseUrl) {
    console.log(`   Supabase URL: ${supabaseUrl}`)
  }
  
  console.log('\n📋 SUMMARY:')
  if (!supabaseUrl || (!serviceKey && !anonKey)) {
    console.log('❌ Missing required environment variables!')
    console.log('   Create a .env file with your Supabase credentials.')
    console.log('   Copy .env.example and fill in your values.')
  } else if (!serviceKey) {
    console.log('⚠️ No service role key - using anon key with limited permissions')
    console.log('   Add SUPABASE_SERVICE_ROLE_KEY for full storage access')
  } else {
    console.log('✅ Environment looks good!')
  }
  
  console.log('\n🔗 Helpful links:')
  console.log('   - Supabase Dashboard: https://supabase.com/dashboard')
  console.log('   - Storage Bucket Management: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets')
  console.log('   - API Keys: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api')
  
  console.log('\n✅ Diagnostic complete!')
}

// Run the diagnostic
main().catch(error => {
  console.error('💥 Diagnostic failed:', error)
  process.exit(1)
})
