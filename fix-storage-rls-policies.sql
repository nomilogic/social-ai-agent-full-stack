-- Fix Supabase storage RLS policies
-- Run this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/fzdpldiqbcssaqczizjw/sql

-- 1. Drop the problematic restrictive policies
DROP POLICY IF EXISTS "Users can upload their own media to images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own media in images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media in images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all objects in images bucket" ON storage.objects;

-- 2. Create comprehensive service role policy (bypasses RLS completely)
CREATE POLICY "service_role_full_access" ON storage.objects
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Create flexible policies for authenticated users that match your folder structure
CREATE POLICY "authenticated_users_can_upload_to_common_folders" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images' AND (
      name LIKE 'ai-generated/%' OR
      name LIKE 'user-uploads/%' OR
      name LIKE 'users/%' OR
      name LIKE 'system/%' OR
      name LIKE 'thumbnails/%'
    )
  );

CREATE POLICY "authenticated_users_can_view_images" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'images');

CREATE POLICY "authenticated_users_can_delete_from_common_folders" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'images' AND (
      name LIKE 'ai-generated/%' OR
      name LIKE 'user-uploads/%' OR
      name LIKE 'users/%' OR
      name LIKE 'system/%' OR
      name LIKE 'thumbnails/%'
    )
  );

-- 4. Allow anonymous users to upload AI-generated content
CREATE POLICY "anonymous_can_upload_ai_content" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'images' AND (
      name LIKE 'ai-generated/%' OR
      name LIKE 'users/anonymous/%'
    )
  );

-- 5. Keep the public read policy (already exists, but recreate to be safe)
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "public_can_view_images" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');
