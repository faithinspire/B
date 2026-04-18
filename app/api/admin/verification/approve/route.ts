import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { braider_id } = body;

    if (!braider_id) {
      return NextResponse.json({ success: false, error: 'braider_id required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Find the braider profile — try by id first, then user_id
    const { data: profileById } = await supabase
      .from('braider_profiles')
      .select('id, user_id, verification_status')
      .eq('id', braider_id)
      .maybeSingle();

    const { data: profileByUserId } = !profileById
      ? await supabase
          .from('braider_profiles')
          .select('id, user_id, verification_status')
          .eq('user_id', braider_id)
          .maybeSingle()
      : { data: null };

    const profile = profileById || profileByUserId;

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Braider profile not found',
      }, { status: 404 });
    }

    // Try updating with 'approved' — if ENUM error, try 'tier1_verified'
    const statusesToTry = ['approved', 'tier1_verified', 'verified'];
    let updated = false;
    let lastError = '';

    for (const status of statusesToTry) {
      const { error } = await supabase
        .from('braider_profiles')
        .update({ verification_status: status })
        .eq('id', profile.id);

      if (!error) {
        updated = true;
        console.log(`Braider approved with status: ${status}`);
        break;
      }
      lastError = error.message;
      console.log(`Status "${status}" failed: ${error.message}`);
    }

    if (!updated) {
      return NextResponse.json({
        success: false,
        error: `Could not update verification status. Run the SQL migration. Last error: ${lastError}`,
      }, { status: 500 });
    }

    // Also update profiles table role to 'braider'
    const userId = profile.user_id;
    if (userId) {
      await supabase
        .from('profiles')
        .update({ role: 'braider' })
        .eq('id', userId);
    }

    return NextResponse.json({ success: true, message: 'Braider approved successfully' });
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
