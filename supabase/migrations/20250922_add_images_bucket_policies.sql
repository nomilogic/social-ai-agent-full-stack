-- Add storage policies for 'images' bucket to allow service role access for video publishing

-- Create policies for the 'images' bucket (which is used by our application)
CREATE POLICY "Service role can manage all objects in images bucket"
  ON storage.objects
  FOR ALL
  TO service_role;

-- Also allow authenticated users to manage their own media in images bucket  
CREATE POLICY "Users can upload their own media to images bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own media in images bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media in images bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to images bucket for social media sharing
CREATE POLICY "Public can view images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');
