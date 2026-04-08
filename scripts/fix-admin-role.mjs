#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminRole() {
  try {
    console.log('🔍 Checking admin user role...\n');

    // Get all users from auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Failed to list users:', usersError.message);
      process.exit(1);
    }

    console.log(`Found ${users.length} users in auth\n`);

    // Check each user's profile
    for (const authUser of users) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error(`❌ Error fetching profile for ${authUser.email}:`, profileError.message);
        continue;
      }

      const authRole = authUser.user_metadata?.role || 'unknown';
      const profileRole = profile?.role || 'unknown';

      console.log(`📧 ${authUser.email}`);
      console.log(`   Auth role: ${authRole}`);
      console.log(`   Profile role: ${profileRole}`);

      // If roles don't match, update profile
      if (authRole !== profileRole && authRole !== 'unknown') {
        console.log(`   ⚠️  Mismatch detected! Updating profile role to: ${authRole}`);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: authRole })
          .eq('id', authUser.id);

        if (updateError) {
          console.error(`   ❌ Failed to update:`, updateError.message);
        } else {
          console.log(`   ✅ Updated successfully`);
        }
      } else if (profileRole === 'unknown') {
        console.log(`   ⚠️  No profile found! Creating one with role: ${authRole}`);

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || '',
            role: authRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(`   ❌ Failed to create:`, insertError.message);
        } else {
          console.log(`   ✅ Created successfully`);
        }
      } else {
        console.log(`   ✅ Roles match`);
      }

      console.log();
    }

    console.log('✨ Admin role check complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdminRole();
