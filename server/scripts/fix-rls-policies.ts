#!/usr/bin/env tsx
/**
 * RLS Policy Fix Script
 * 
 * This script diagnoses and fixes Row Level Security policies for Supabase Storage
 */

import { serverSupabase } from '../supabaseClient.js'

async function main() {
  console.log('🔒 Diagnosing and fixing RLS policies...\n')

  try {
    // Test current service role permissions
    console.log('1️⃣ Testing service role upload permissions...')
    
    const testFileName = `test-upload-${Date.now()}.txt`
    const testContent = 'Test file for RLS policy validation'
    
    // Try uploading to different paths to see which work
    const testPaths = [
      'ai-generated', 
      'user-uploads',
      'users/anonymous/ai-generated',
      'system'
    ]
    
    for (const folder of testPaths) {
      const fullPath = `${folder}/${testFileName}`
      console.log(`   Testing upload to: ${fullPath}`)
      
      const { data, error } = await serverSupabase.storage
        .from('images')
        .upload(fullPath, testContent, {
          contentType: 'text/plain',
          upsert: true
        })
      
      if (error) {
        console.log(`   ❌ Failed: ${error.message}`)
        
        // Check if it's an RLS policy error
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
          console.log(`   🔒 RLS policy blocking upload to ${folder}`)
        }
      } else {
        console.log(`   ✅ Success: ${data.path}`)
        
        // Clean up test file
        await serverSupabase.storage
          .from('images')
          .remove([fullPath])
      }
    }

    console.log('\n2️⃣ Checking existing RLS policies...')
    
    // Query existing policies using raw SQL
    const { data: policies, error: policyError } = await serverSupabase
      .rpc('get_storage_policies', {})
      .catch(async () => {
        // Fallback: try querying directly
        return await serverSupabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'objects')
          .eq('schemaname', 'storage')
      })

    if (policyError) {
      console.log('   ⚠️ Could not query existing policies directly')
      console.log('   This is normal - policies might still be working')
    } else if (policies) {
      console.log(`   Found ${policies.length} existing policies`)
      policies.forEach((policy: any) => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} for ${policy.roles}`)
      })
    }

    console.log('\n3️⃣ Applying fixes...')
    
    // The main fix: Create a comprehensive policy for service role
    const fixes = [
      {
        name: 'Service role full access policy',
        sql: `
          -- Drop existing conflicting policies
          DROP POLICY IF EXISTS "Service role can manage all objects in images bucket" ON storage.objects;
          
          -- Create new comprehensive service role policy
          CREATE POLICY "service_role_all_access" ON storage.objects
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
        `
      },
      {
        name: 'Allow uploads to common folders',
        sql: `
          -- Drop existing user policies that might be too restrictive
          DROP POLICY IF EXISTS "Users can upload their own media to images bucket" ON storage.objects;
          
          -- Create more flexible policy for common upload folders
          CREATE POLICY "allow_common_folders_upload" ON storage.objects
            FOR INSERT
            TO authenticated
            WITH CHECK (
              bucket_id = 'images' AND (
                name LIKE 'ai-generated/%' OR
                name LIKE 'user-uploads/%' OR
                name LIKE 'users/%' OR
                name LIKE 'system/%'
              )
            );
        `
      },
      {
        name: 'Allow anonymous uploads for AI content',
        sql: `
          -- Allow anonymous/unauthenticated uploads for AI-generated content
          CREATE POLICY IF NOT EXISTS "allow_anonymous_ai_uploads" ON storage.objects
            FOR INSERT
            TO anon
            WITH CHECK (
              bucket_id = 'images' AND (
                name LIKE 'ai-generated/%' OR
                name LIKE 'users/anonymous/%'
              )
            );
        `
      }
    ]

    for (const fix of fixes) {
      console.log(`   Applying: ${fix.name}`)
      
      try {
        const { error } = await serverSupabase.rpc('exec_sql', { sql: fix.sql })
        
        if (error) {
          console.log(`   ❌ Failed to apply ${fix.name}: ${error.message}`)
          
          // Try alternative approach - execute each statement separately
          const statements = fix.sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0)
          
          for (const statement of statements) {
            try {
              await serverSupabase.rpc('exec_sql', { sql: statement })
            } catch (e: any) {
              console.log(`   ⚠️ Statement failed (may be ok): ${e.message}`)
            }
          }
        } else {
          console.log(`   ✅ Applied: ${fix.name}`)
        }
      } catch (e: any) {
        console.log(`   ❌ Exception applying ${fix.name}: ${e.message}`)
      }
    }

    console.log('\n4️⃣ Testing uploads after fixes...')
    
    for (const folder of testPaths) {
      const fullPath = `${folder}/test-after-fix-${Date.now()}.txt`
      console.log(`   Testing upload to: ${fullPath}`)
      
      const { data, error } = await serverSupabase.storage
        .from('images')
        .upload(fullPath, 'Test after RLS fix', {
          contentType: 'text/plain',
          upsert: true
        })
      
      if (error) {
        console.log(`   ❌ Still failing: ${error.message}`)
      } else {
        console.log(`   ✅ Now working: ${data.path}`)
        
        // Clean up
        await serverSupabase.storage
          .from('images')
          .remove([fullPath])
      }
    }

    console.log('\n5️⃣ Manual fix instructions...')
    console.log('If the automated fixes didn\'t work, apply these manually in Supabase Dashboard:')
    console.log('')
    console.log('Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/policies')
    console.log('')
    console.log('1. Delete any conflicting policies on storage.objects')
    console.log('2. Create this policy for service_role:')
    console.log('')
    console.log('   Policy name: service_role_full_access')
    console.log('   Allowed operation: ALL')
    console.log('   Target roles: service_role')
    console.log('   USING expression: true')
    console.log('   WITH CHECK expression: true')
    console.log('')
    console.log('3. For anonymous AI uploads, create:')
    console.log('')
    console.log('   Policy name: allow_ai_uploads')
    console.log('   Allowed operation: INSERT')  
    console.log('   Target roles: anon, authenticated')
    console.log('   WITH CHECK: bucket_id = \'images\' AND (name LIKE \'ai-generated/%\' OR name LIKE \'users/%\' OR name LIKE \'user-uploads/%\')')
    
    console.log('\n✅ RLS Policy diagnostic complete!')

  } catch (error: any) {
    console.error('❌ Error during RLS fix:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
