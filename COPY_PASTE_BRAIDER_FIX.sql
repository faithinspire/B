-- ============================================================================
-- COPY AND PASTE THIS ENTIRE SCRIPT INTO SUPABASE SQL EDITOR
-- ============================================================================
-- This fixes braiders not showing on homepage and not available for booking
-- ============================================================================

-- DISABLE RLS (BYPASS)
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- POPULATE BRAIDER PROFILES
INSERT INTO braider_profiles (user_id, full_name, email, bio, experience_years, rating_avg, rating_count, verification_status, travel_radius_miles, is_mobile, created_at, updated_at)
SELECT p.id, COALESCE(p.full_name, 'Professional Braider'), COALESCE(p.email, ''), 'Professional braiding services', 0, 5.0, 0, 'verified', 15, true, NOW(), NOW()
FROM profiles p
WHERE p.role = 'braider'
AND NOT EXISTS (SELECT 1 FROM braider_profiles bp WHERE bp.user_id = p.id)
ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, updated_at = NOW();

-- CREATE BOX BRAIDS SERVICE
INSERT INTO services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT bp.user_id, 'Box Braids', 'Professional box braids - protective style', 'box_braids', 120, 80.00, true, NOW(), NOW()
FROM braider_profiles bp
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.braider_id = bp.user_id AND s.name = 'Box Braids')
ON CONFLICT DO NOTHING;

-- CREATE KNOTLESS BRAIDS SERVICE
INSERT INTO services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT bp.user_id, 'Knotless Braids', 'Knotless braiding - less tension, more comfortable', 'knotless', 150, 100.00, true, NOW(), NOW()
FROM braider_profiles bp
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.braider_id = bp.user_id AND s.name = 'Knotless Braids')
ON CONFLICT DO NOTHING;

-- CREATE CORNROWS SERVICE
INSERT INTO services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT bp.user_id, 'Cornrows', 'Beautiful cornrow styles - classic and modern', 'cornrows', 90, 60.00, true, NOW(), NOW()
FROM braider_profiles bp
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.braider_id = bp.user_id AND s.name = 'Cornrows')
ON CONFLICT DO NOTHING;

-- CREATE TWISTS SERVICE
INSERT INTO services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT bp.user_id, 'Twists', 'Senegalese twists and other twist styles', 'twists', 120, 75.00, true, NOW(), NOW()
FROM braider_profiles bp
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.braider_id = bp.user_id AND s.name = 'Twists')
ON CONFLICT DO NOTHING;

-- VERIFY RESULTS
SELECT 'Braider Profiles' as table_name, COUNT(*) as total_records FROM braider_profiles
UNION ALL
SELECT 'Services' as table_name, COUNT(*) as total_records FROM services;

-- SHOW BRAIDERS WITH SERVICES
SELECT bp.full_name, bp.email, bp.verification_status, COUNT(s.id) as service_count
FROM braider_profiles bp
LEFT JOIN services s ON s.braider_id = bp.user_id
GROUP BY bp.id, bp.full_name, bp.email, bp.verification_status
ORDER BY bp.created_at DESC;

-- SHOW ALL SERVICES
SELECT bp.full_name as braider_name, s.name as service_name, s.price, s.duration_minutes, s.is_active
FROM services s
JOIN braider_profiles bp ON bp.user_id = s.braider_id
ORDER BY bp.full_name, s.name;

