import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status, verified_by, notes } = await request.json();

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update verification record
    const { data, error } = await supabase
      .from('braider_verifications')
      .update({
        status,
        verified_by,
        verified_at: new Date().toISOString(),
        notes,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Verification update error:', error);
      throw new Error(`Failed to update verification: ${error.message}`);
    }

    // If approved, update braider profile status
    if (status === 'approved' && data) {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ verified: true })
        .eq('id', data.braider_id);

      if (profileErr) {
        console.error('Profile update error:', profileErr);
        // Don't throw - verification was already updated
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating verification:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update verification' },
      { status: 500 }
    );
  }
}
