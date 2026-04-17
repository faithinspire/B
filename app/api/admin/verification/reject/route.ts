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

    // Try 'unverified' first (valid enum value for rejection), fall back to 'rejected'
    const { error: updateError } = await supabase
      .from('braider_profiles')
      .update({
        verification_status: 'unverified',
        profile_approved: false,
        is_active: false,
      })
      .eq('id', braider_id);

    if (updateError) {
      console.error('Reject with unverified failed:', updateError.message);
      
      // Try with 'rejected' (if enum was extended or column is text)
      const { error: updateError2 } = await supabase
        .from('braider_profiles')
        .update({
          verification_status: 'rejected',
          profile_approved: false,
          is_active: false,
        })
        .eq('id', braider_id);

      if (updateError2) {
        console.error('Reject with rejected failed:', updateError2.message);
        
        // Last resort: just update profile_approved
        const { error: updateError3 } = await supabase
          .from('braider_profiles')
          .update({ profile_approved: false, is_active: false })
          .eq('id', braider_id);

        if (updateError3) {
          return NextResponse.json({ success: false, error: updateError3.message }, { status: 500 });
        }
        
        return NextResponse.json({ success: true, message: 'Braider rejected (profile_approved set to false)' });
      }
    }

    return NextResponse.json({ success: true, message: 'Braider rejected successfully' });
  } catch (error) {
    console.error('Reject error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
