#!/usr/bin/env tsx
/**
 * Database RLS Test Script
 * 
 * Tests database insertions to identify RLS policy issues
 */

import { serverSupabase } from '../supabaseClient.js'
import { db } from '../db.js'
import { media, campaigns, posts } from '../../shared/schema.js'
import crypto from 'crypto'

async function main() {
  console.log('🔒 Testing database RLS policies...\n')

  try {
    // Generate valid UUIDs for testing
    const testUserId = crypto.randomUUID()
    
    // Test 1: Direct Supabase client insertions
    console.log('1️⃣ Testing direct Supabase client insertions...')
    
    // Test media table insertion
    console.log('   Testing media table insertion...')
    try {
      const { data: mediaData, error: mediaError } = await serverSupabase
        .from('media')
        .insert({
          user_id: testUserId,
          filename: 'test.jpg',
          original_name: 'test.jpg',
          file_path: '/test/test.jpg',
          file_url: '/test/test.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          media_type: 'image'
        })
        .select()
        .single()

      if (mediaError) {
        console.log(`   ❌ Media table RLS error: ${mediaError.message}`)
        if (mediaError.message.includes('row-level security')) {
          console.log(`   🔒 This is the RLS policy causing your error!`)
        }
      } else {
        console.log(`   ✅ Media table insertion successful`)
        
        // Clean up
        await serverSupabase
          .from('media')
          .delete()
          .eq('id', mediaData.id)
      }
    } catch (error: any) {
      console.log(`   💥 Media table exception: ${error.message}`)
    }

    // Test campaigns table insertion
    console.log('   Testing campaigns table insertion...')
    try {
      const { data: campaignData, error: campaignError } = await serverSupabase
        .from('campaigns')
        .insert({
          user_id: testUserId,
          name: 'Test Campaign',
          brand_tone: 'professional',
          goals: ['engagement'],
          platforms: ['linkedin']
        })
        .select()
        .single()

      if (campaignError) {
        console.log(`   ❌ Campaigns table RLS error: ${campaignError.message}`)
        if (campaignError.message.includes('row-level security')) {
          console.log(`   🔒 This is the RLS policy causing your error!`)
        }
      } else {
        console.log(`   ✅ Campaigns table insertion successful`)
        
        // Clean up
        await serverSupabase
          .from('campaigns')
          .delete()
          .eq('id', campaignData.id)
      }
    } catch (error: any) {
      console.log(`   💥 Campaigns table exception: ${error.message}`)
    }

    // Test posts table insertion  
    console.log('   Testing posts table insertion...')
    try {
      const { data: postData, error: postError } = await serverSupabase
        .from('posts')
        .insert({
          user_id: testUserId,
          campaign_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          prompt: 'Test post'
        })
        .select()
        .single()

      if (postError) {
        console.log(`   ❌ Posts table RLS error: ${postError.message}`)
        if (postError.message.includes('row-level security')) {
          console.log(`   🔒 This is the RLS policy causing your error!`)
        }
      } else {
        console.log(`   ✅ Posts table insertion successful`)
        
        // Clean up
        await serverSupabase
          .from('posts')
          .delete()
          .eq('id', postData.id)
      }
    } catch (error: any) {
      console.log(`   💥 Posts table exception: ${error.message}`)
    }

    // Test 2: Drizzle ORM insertions
    console.log('\n2️⃣ Testing Drizzle ORM insertions...')
    
    console.log('   Testing media table with Drizzle...')
    try {
      const [mediaRecord] = await db.insert(media).values({
        user_id: testUserId,
        filename: 'test-drizzle.jpg',
        original_name: 'test-drizzle.jpg', 
        file_path: '/test/test-drizzle.jpg',
        file_url: '/test/test-drizzle.jpg',
        mime_type: 'image/jpeg',
        file_size: 1024,
        media_type: 'image'
      }).returning()

      console.log(`   ✅ Drizzle media insertion successful: ${mediaRecord.id}`)
      
      // Clean up
      await db.delete(media).where(eq(media.id, mediaRecord.id))
      
    } catch (error: any) {
      console.log(`   ❌ Drizzle media RLS error: ${error.message}`)
      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        console.log(`   🔒 This is likely your RLS problem!`)
      }
    }

    // Test 3: Check RLS status on tables
    console.log('\n3️⃣ Checking RLS status on tables...')
    
    try {
      const { data: rlsStatus, error } = await serverSupabase
        .rpc('check_table_rls_status', {})
        .catch(async () => {
          // Fallback query
          return await serverSupabase
            .from('pg_class')
            .select('relname, relrowsecurity')
            .in('relname', ['media', 'campaigns', 'posts', 'users'])
        })

      if (rlsStatus) {
        rlsStatus.forEach((table: any) => {
          const hasRLS = table.relrowsecurity || table.has_rls
          console.log(`   ${table.relname || table.table_name}: RLS ${hasRLS ? '✅ Enabled' : '❌ Disabled'}`)
        })
      }
    } catch (error: any) {
      console.log('   ⚠️ Could not check RLS status directly')
    }

    console.log('\n4️⃣ Recommended fixes...')
    console.log('')
    
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('✅ You have a service role key, which should bypass RLS.')
      console.log('   If you\'re still getting RLS errors, it might be because:')
      console.log('   1. Your application code is using the anon key instead of service key')
      console.log('   2. There are restrictive policies even for service role')
      console.log('   3. The error is coming from a different table')
    } else {
      console.log('❌ No SUPABASE_SERVICE_ROLE_KEY found in environment')
      console.log('   This could be why you\'re getting RLS errors.')
    }

    console.log('')
    console.log('🔧 Manual fixes in Supabase Dashboard:')
    console.log('   1. Go to: https://supabase.com/dashboard/project/fzdpldiqbcssaqczizjw/settings/api')
    console.log('   2. Copy your service_role key')
    console.log('   3. Add it to your .env file as SUPABASE_SERVICE_ROLE_KEY')
    console.log('')
    console.log('   OR disable RLS on tables causing issues:')
    console.log('   - Go to: https://supabase.com/dashboard/project/fzdpldiqbcssaqczizjw/database/tables')
    console.log('   - For each problematic table, go to "Settings" tab')
    console.log('   - Toggle off "Enable Row Level Security"')

    console.log('\n✅ Database RLS diagnostic complete!')

  } catch (error: any) {
    console.error('❌ Error during database RLS test:', error.message)
    process.exit(1)
  }
}

// Import eq function
import { eq } from 'drizzle-orm'

main().catch(console.error)
