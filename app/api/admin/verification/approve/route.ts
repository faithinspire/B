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

    // First check what the current verification_status column type accepts
    // Try 'tier1_verified' first (standard enum value), fall back to 'approved'
    let updateData: Record<string, unknown> = {
      profile_approved: true,
      is_active: true,
    };

    // Try to update with tier1_verified (valid enum value)
    const { error: updateError } = await supabase
      .from('braider_profiles')
      .update({
        ...updateData,
        verification_status: 'tier1_verified',
      })
      .eq('id', braider_id);

    if (updateError) {
      console.error('Approve with tier1_verified failed:', updateError.message);
      
      // Try with 'approved' (if enum was extended or column is text)
      const { error: updateError2 } = await supabase
        .from('braider_profiles')
        .update({
          ...updateData,
          verification_status: 'approved',
        })
        .eq('id', braider_id);

      if (updateError2) {
        console.error('Approve with approved failed:', updateError2.message);
        
        // Last resort: just update profile_approved without changing status
        const { error: updateError3 } = await supabase
          .from('braider_profiles')
          .update({ profile_approved: true, is_active: true })
          .eq('id', braider_id);

        if (updateError3) {
          return NextResponse.json({ success: false, error: updateError3.message }, { status: 500 });
        }
        
        return NextResponse.json({ success: true, message: 'Braider approved (profile_approved set to true)' });
      }
    }

    return NextResponse.json({ success: true, message: 'Braider approved successfully' });
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
