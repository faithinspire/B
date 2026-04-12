import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    console.log('Fetching braiders for verification...');

    // Fetch all braiders
    const { data: braiders, error: braiderErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, verification_status')
      .eq('role', 'braider')
      .order('created_at', { ascending: false });

    if (braiderErr) {
      console.error('Braiders fetch error:', braiderErr);
      return NextResponse.json([]);
    }

    if (!braiders || braiders.length === 0) {
      return NextResponse.json([]);
    }

    // Transform to verification format
    const verifications = braiders.map((braider: any) => ({
      id: braider.id,
      braider_id: braider.id,
      braider_name: braider.full_name || 'Unknown',
      email: braider.email || '',
      phone: braider.phone || '',
      status: braider.verification_status || 'pending',
      document_type: 'ID Document',
      document_url: null,
      submitted_at: new Date().toISOString(),
      verified_at: null,
      verified_by: null,
      notes: null,
    }));

    return NextResponse.json(verifications);
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json([]);
  }
}
