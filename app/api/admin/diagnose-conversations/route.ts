import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Get conversations table info
    const { data: convData, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .limit(1);

    if (convError) {
      return NextResponse.json({
        error: 'Failed to query conversations',
        details: convError.message,
      }, { status: 500 });
    }

    // Get sample conversation to see actual schema
    const { data: sample } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .limit(1)
      .single();

    // Get all columns by checking a single row
    const columns = sample ? Object.keys(sample) : [];

    return NextResponse.json({
      success: true,
      conversations_table_exists: true,
      sample_columns: columns,
      sample_data: sample,
      has_booking_id: columns.includes('booking_id'),
      has_customer_id: columns.includes('customer_id'),
      has_braider_id: columns.includes('braider_id'),
      has_participant1_id: columns.includes('participant1_id'),
      has_participant2_id: columns.includes('participant2_id'),
      total_columns: columns.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Diagnostic error',
      details: error?.message || String(error),
    }, { status: 500 });
  }
}
