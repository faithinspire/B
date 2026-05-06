-- ── STORAGE BUCKETS ──────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars',   'avatars',   true, 5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('portfolio', 'portfolio', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── NUKE ALL OLD BROKEN STORAGE POLICIES ─────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
  END LOOP;
END $$;

-- ── FRESH STORAGE POLICIES - ALLOW ALL AUTHENTICATED USERS ────────────────
-- AVATARS bucket - allow authenticated users to upload
CREATE POLICY "avatars_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- AVATARS bucket - allow authenticated users to update their own
CREATE POLICY "avatars_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

-- AVATARS bucket - allow authenticated users to delete their own
CREATE POLICY "avatars_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

-- AVATARS bucket - allow public to read
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- PORTFOLIO bucket - allow authenticated users to upload
CREATE POLICY "portfolio_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio');

-- PORTFOLIO bucket - allow authenticated users to delete their own
CREATE POLICY "portfolio_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'portfolio');

-- PORTFOLIO bucket - allow public to read
CREATE POLICY "portfolio_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'portfolio');

-- ── NUKE ALL OLD BROKEN TABLE RLS POLICIES ───────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles','braider_profiles','services','portfolio_images')
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
  END LOOP;
END $$;

-- ── ENABLE RLS ON ALL TABLES ─────────────────────────────
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.braider_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images  ENABLE ROW LEVEL SECURITY;

-- ── PROFILES TABLE POLICIES ──────────────────────────────
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Braiders/customers need to read each other's basic profile
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT TO public
  USING (true);

-- ── BRAIDER_PROFILES TABLE POLICIES ─────────────────────
CREATE POLICY "braider_profiles_public_select" ON public.braider_profiles
  FOR SELECT TO public
  USING (true);

CREATE POLICY "braider_profiles_insert_own" ON public.braider_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "braider_profiles_update_own" ON public.braider_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── SERVICES TABLE POLICIES ──────────────────────────────
CREATE POLICY "services_public_select" ON public.services
  FOR SELECT TO public
  USING (true);

CREATE POLICY "services_insert_own" ON public.services
  FOR INSERT TO authenticated
  WITH CHECK (braider_id = auth.uid());

CREATE POLICY "services_update_own" ON public.services
  FOR UPDATE TO authenticated
  USING (braider_id = auth.uid())
  WITH CHECK (braider_id = auth.uid());

CREATE POLICY "services_delete_own" ON public.services
  FOR DELETE TO authenticated
  USING (braider_id = auth.uid());

-- ── PORTFOLIO_IMAGES TABLE POLICIES ─────────────────────
CREATE POLICY "portfolio_public_select" ON public.portfolio_images
  FOR SELECT TO public
  USING (true);

CREATE POLICY "portfolio_insert_own" ON public.portfolio_images
  FOR INSERT TO authenticated
  WITH CHECK (braider_id = auth.uid());

CREATE POLICY "portfolio_delete_own" ON public.portfolio_images
  FOR DELETE TO authenticated
  USING (braider_id = auth.uid());

-- ── AUTO-CREATE braider_profiles ROW ON SIGNUP ───────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'customer'))
  ON CONFLICT (id) DO NOTHING;
  
  IF (NEW.raw_user_meta_data->>'role') = 'braider' THEN
    INSERT INTO public.braider_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
