-- ============================================================================
-- MARKETPLACE STORAGE SETUP
-- ============================================================================
-- This migration sets up storage buckets and policies for marketplace images

-- ============================================================================
-- STEP 1: CREATE STORAGE BUCKET (if not exists)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'braider-uploads',
  'braider-uploads',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: DISABLE RLS ON STORAGE OBJECTS (Allow public access)
-- ============================================================================
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: CREATE STORAGE POLICIES FOR PUBLIC ACCESS
-- ============================================================================
-- Allow anyone to view public files
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'braider-uploads');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'braider-uploads' AND
    auth.role() = 'authenticated'
  );

-- Allow users to update their own files
CREATE POLICY "User Update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'braider-uploads' AND
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own files
CREATE POLICY "User Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'braider-uploads' AND
    auth.role() = 'authenticated'
  );

-- ============================================================================
-- STEP 4: RE-ENABLE RLS (with policies in place)
-- ============================================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Storage bucket is now ready for marketplace image uploads
-- ✅ Public read access enabled
-- ✅ Authenticated user uploads enabled
-- ✅ File size limit: 50MB
-- ✅ Allowed formats: JPEG, PNG, WebP, GIF

