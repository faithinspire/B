-- Fix storage bucket to be public so product images are accessible
-- Run this in Supabase SQL Editor

-- Make braider-uploads bucket public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'braider-uploads';

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'braider-uploads',
  'braider-uploads', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800;

-- Allow public read access to all files in braider-uploads
CREATE POLICY IF NOT EXISTS "Public read access for braider-uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'braider-uploads');

-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload to braider-uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'braider-uploads' AND auth.role() = 'authenticated');

-- Allow users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update own files in braider-uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'braider-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete own files in braider-uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'braider-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Also ensure marketplace_products table allows all operations
ALTER TABLE IF EXISTS marketplace_products DISABLE ROW LEVEL SECURITY;

-- Verify the bucket is public
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE name = 'braider-uploads';
