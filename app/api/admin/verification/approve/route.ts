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

    console.log('Approving braider:', braider_id);

    // Update the braider profile verification status
    const { error: updateError } = await supabase
      .from('braider_profiles')
      .update({ verification_status: 'approved' })
      .eq('id', braider_id);

    if (updateError) {
      console.error('Error updating braider profile:', updateError);
      
      // Try with user_id instead of id
      const { error: updateError2 } = await supabase
        .from('braider_profiles')
        .update({ verification_status: 'approved' })
        .eq('user_id', braider_id);

      if (updateError2) {
        return NextResponse.json({ 
          success: false, 
          error: `Failed to update: ${updateError2.message}` 
        }, { status: 500 });
      }
    }

    // Also update the profiles table role if needed
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'braider' })
      .eq('id', braider_id);

    if (profileError) {
      console.log('Note: Could not update profile role:', profileError.message);
    }

    console.log('Braider approved successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Braider approved successfully' 
    });
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
