-- ============================================================================
-- CREATE ALL STORAGE BUCKETS
-- Run this in Supabase SQL Editor ONCE
-- ============================================================================

-- Create braider-uploads bucket (marketplace product images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'braider-uploads',
  'braider-uploads',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- Create avatars bucket (profile photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- Create portfolio bucket (braider portfolio images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio',
  'portfolio',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Create braider-documents bucket (verification docs - private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'braider-documents',
  'braider-documents',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880;

-- ============================================================================
-- STORAGE POLICIES - Allow service role full access (bypasses RLS)
-- ============================================================================

-- braider-uploads: public read, authenticated write
CREATE POLICY "Public read braider-uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'braider-uploads');

CREATE POLICY "Authenticated upload braider-uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'braider-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Owner delete braider-uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'braider-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- avatars: public read, authenticated write
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Owner update avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- portfolio: public read, authenticated write
CREATE POLICY "Public read portfolio" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio');

CREATE POLICY "Authenticated upload portfolio" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'portfolio' AND auth.role() = 'authenticated');

-- braider-documents: authenticated read own, authenticated write
CREATE POLICY "Authenticated read braider-documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'braider-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated upload braider-documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'braider-documents' AND auth.role() = 'authenticated');

-- ============================================================================
-- DONE
-- ============================================================================
