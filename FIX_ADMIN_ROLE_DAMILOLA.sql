-- Fix Admin Role for damilola@gmail.com
-- This SQL directly updates the profiles table to set the role to 'admin'

-- Step 1: Find the user ID for damilola@gmail.com
SELECT id, email, role FROM profiles WHERE email = 'damilola@gmail.com';

-- Step 2: Update the role to 'admin' (replace USER_ID with the actual ID from Step 1)
UPDATE profiles 
SET role = 'admin', updated_at = NOW() 
WHERE email = 'damilola@gmail.com';

-- Step 3: Verify the update was successful
SELECT id, email, role, updated_at FROM profiles WHERE email = 'damilola@gmail.com';

-- Step 4: Also update the auth metadata if needed (optional, but recommended)
-- Note: This requires service role access in Supabase
-- You may need to do this through Supabase dashboard manually if SQL doesn't work
