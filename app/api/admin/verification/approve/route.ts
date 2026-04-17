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

    // Try tier1_verified first (original enum), then approved (after TEXT migration)
    const { error: e1 } = await supabase
      .from('braider_profiles')
      .update({ verification_status: 'tier1_verified' })
      .eq('id', braider_id);

    if (!e1) {
      return NextResponse.json({ success: true, message: 'Braider approved successfully' });
    }

    // Fallback: try 'approved' (works if column is TEXT)
    const { error: e2 } = await supabase
      .from('braider_profiles')
      .update({ verification_status: 'approved' })
      .eq('id', braider_id);

    if (!e2) {
      return NextResponse.json({ success: true, message: 'Braider approved successfully' });
    }

    console.error('Both approve attempts failed:', e1.message, e2.message);
    return NextResponse.json({ success: false, error: `Could not update status: ${e2.message}` }, { status: 500 });
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
