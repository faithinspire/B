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

    let success = false;
    let lastError = '';

    // Attempt 1: unverified (original enum value)
    const { error: e1 } = await supabase
      .from('braider_profiles')
      .update({ verification_status: 'unverified', is_active: false })
      .eq('id', braider_id);

    if (!e1) {
      success = true;
    } else {
      lastError = e1.message;

      // Attempt 2: rejected (after migration to TEXT)
      const { error: e2 } = await supabase
        .from('braider_profiles')
        .update({ verification_status: 'rejected', is_active: false })
        .eq('id', braider_id);

      if (!e2) {
        success = true;
      } else {
        lastError = e2.message;

        // Attempt 3: just set is_active
        const { error: e3 } = await supabase
          .from('braider_profiles')
          .update({ is_active: false })
          .eq('id', braider_id);

        if (!e3) success = true;
        else lastError = e3.message;
      }
    }

    if (!success) {
      return NextResponse.json({ success: false, error: lastError }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Braider rejected successfully' });
  } catch (error) {
    console.error('Reject error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
