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

    // First, check the current braider profile to understand the schema
    const { data: currentProfile, error: fetchError } = await supabase
      .from('braider_profiles')
      .select('id, verification_status')
      .eq('id', braider_id)
      .single();

    if (fetchError) {
      console.error('Error fetching braider profile:', fetchError);
      return NextResponse.json({ success: false, error: `Braider not found: ${fetchError.message}` }, { status: 404 });
    }

    console.log('Current braider profile:', currentProfile);

    // Try different status values based on what might be accepted
    const statusValues = ['approved', 'tier1_verified', 'verified', 'active'];
    
    for (const status of statusValues) {
      const { error } = await supabase
        .from('braider_profiles')
        .update({ verification_status: status })
        .eq('id', braider_id);

      if (!error) {
        console.log(`Braider approved successfully with "${status}" status`);
        return NextResponse.json({ 
          success: true, 
          message: 'Braider approved successfully',
          newStatus: status 
        });
      }
      
      console.log(`Failed with status "${status}":`, error.message);
    }

    // If all updates failed, try using raw SQL via RPC
    const { error: rpcError } = await supabase.rpc('update_braider_verification', {
      p_braider_id: braider_id,
      p_status: 'approved'
    });

    if (!rpcError) {
      console.log('Braider approved successfully via RPC');
      return NextResponse.json({ success: true, message: 'Braider approved successfully' });
    }

    console.error('All approve attempts failed');
    return NextResponse.json({ 
      success: false, 
      error: 'Could not update verification status. Please run the SQL migration in Supabase.' 
    }, { status: 500 });
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
