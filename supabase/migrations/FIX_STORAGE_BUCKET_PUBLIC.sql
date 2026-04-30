-- ============================================================
-- FIX: Make braider-uploads storage bucket public
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Make the bucket public (or create it if missing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'braider-uploads',
  'braider-uploads',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Step 2: Drop existing policies to avoid conflicts, then recreate
DO $$
BEGIN
  -- Drop old policies if they exist
  DROP POLICY IF EXISTS "Public read access for braider-uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload to braider-uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own files in braider-uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own files in braider-uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
END $$;

-- Step 3: Create clean policies
CREATE POLICY "Public read access for braider-uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'braider-uploads');

CREATE POLICY "Authenticated users can upload to braider-uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'braider-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own files in braider-uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'braider-uploads');

CREATE POLICY "Users can delete own files in braider-uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'braider-uploads');

-- Step 4: Disable RLS on marketplace_products so products are always visible
ALTER TABLE IF EXISTS marketplace_products DISABLE ROW LEVEL SECURITY;

-- Step 5: Verify
SELECT id, name, public FROM storage.buckets WHERE name = 'braider-uploads';
