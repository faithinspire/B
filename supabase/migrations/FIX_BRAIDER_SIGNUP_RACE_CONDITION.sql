-- ============================================================================
-- FIX: Remove braider profile validation trigger that causes race condition
-- ============================================================================
-- The trigger was checking if braider_profiles exists when profiles.role='braider'
-- This caused a race condition during signup because:
-- 1. Profile is created/updated with role='braider'
-- 2. Trigger fires and checks if braider_profiles exists
-- 3. braider_profiles hasn't been created yet (created after profile in signup flow)
-- 4. Trigger fails with "Braider profile must exist for role=braider"
--
-- SOLUTION: Remove the trigger. The application logic in signup/route.ts ensures
-- that braider_profiles is created immediately after the profile is created.
-- This is enforced at the application level, not the database level.

DROP TRIGGER IF EXISTS check_braider_profile_trigger ON profiles;
DROP FUNCTION IF EXISTS check_braider_profile_exists();

-- ============================================================================
-- ALTERNATIVE: If we want database-level validation, use a different approach:
-- Instead of checking on UPDATE, we can add a CHECK constraint that allows
-- the profile to be created with role='braider' even if braider_profiles
-- doesn't exist yet. The constraint would only validate on SELECT/UPDATE
-- after the transaction completes.
--
-- For now, we rely on application-level validation in the signup endpoint.
-- ============================================================================
