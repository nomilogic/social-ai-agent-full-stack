#!/usr/bin/env tsx
/**
 * Simple Upload Test Script
 * 
 * Tests if uploads are working to resolve RLS issues
 */

import { serverSupabase } from '../supabaseClient.js'

async function main() {
  console.log('🧪 Testing Supabase uploads to diagnose RLS issues...\n')

  try {
    const testContent = `Test upload at ${new Date().toISOString()}`
    const timestamp = Date.now()
    
    // Test different upload scenarios
    const tests = [
      {
        name: 'AI Generated folder',
        path: `ai-generated/test-${timestamp}.txt`,
        shouldWork: true
      },
      {
        name: 'User uploads folder',
        path: `user-uploads/test-${timestamp}.txt`, 
        shouldWork: true
      },
      {
        name: 'Anonymous AI folder',
        path: `users/anonymous/ai-generated/test-${timestamp}.txt`,
        shouldWork: true
      },
      {
        name: 'Root level (direct)',
        path: `test-root-${timestamp}.txt`,
        shouldWork: true // Service role should be able to upload anywhere
      }
    ]

    let successCount = 0
    let totalTests = tests.length

    for (const test of tests) {
      console.log(`📝 Testing: ${test.name}`)
      console.log(`   Path: ${test.path}`)
      
      try {
        const { data, error } = await serverSupabase.storage
          .from('images')
          .upload(test.path, testContent, {
            contentType: 'text/plain',
            upsert: true
          })

        if (error) {
          console.log(`   ❌ Failed: ${error.message}`)
          
          if (error.message.includes('row-level security') || error.message.includes('policy')) {
            console.log(`   🔒 RLS Policy is blocking this upload`)
          }
        } else {
          console.log(`   ✅ Success! File uploaded to: ${data.path}`)
          successCount++
          
          // Clean up test file
          await serverSupabase.storage
            .from('images')
            .remove([test.path])
            .then(() => console.log(`   🧹 Cleaned up test file`))
        }
      } catch (error: any) {
        console.log(`   💥 Exception: ${error.message}`)
      }
      
      console.log('') // Empty line for readability
    }

    // Summary
    console.log('📊 SUMMARY:')
    console.log(`   ✅ Successful uploads: ${successCount}/${totalTests}`)
    
    if (successCount === totalTests) {
      console.log('   🎉 All uploads working! RLS policies are correctly configured.')
      console.log('   💡 If you\'re still seeing "row-level security policy" errors,')
      console.log('      they might be coming from a different part of your code.')
    } else {
      console.log('   ⚠️ Some uploads failed. RLS policies need adjustment.')
      console.log('')
      console.log('🔧 MANUAL FIX:')
      console.log('   1. Go to Supabase Dashboard → Storage → Policies')
      console.log('   2. Ensure service_role has full access policy:')
      console.log('')
      console.log('   Policy Name: "Service Role Full Access"')
      console.log('   Target Roles: service_role')  
      console.log('   Allowed Operations: ALL')
      console.log('   USING expression: true')
      console.log('   WITH CHECK expression: true')
    }

    console.log('')
    console.log('🔗 Supabase Dashboard:')
    console.log('   https://supabase.com/dashboard/project/fzdpldiqbcssaqczizjw/storage/policies')

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
