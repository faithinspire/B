import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    // Fetch all braiders with verification documents
    const { data: braiders, error: braiderErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role')
      .eq('role', 'braider')
      .order('created_at', { ascending: false });

    if (braiderErr) {
      console.error('Braiders fetch error:', braiderErr);
      throw new Error(`Failed to fetch braiders: ${braiderErr.message}`);
    }

    if (!braiders || braiders.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch verification documents for each braider
    const verifications = await Promise.all(
      braiders.map(async (braider) => {
        try {
          const { data: docs, error: docErr } = await supabase
            .from('braider_verifications')
            .select('*')
            .eq('braider_id', braider.id)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .single();

          if (docErr && docErr.code !== 'PGRST116') {
            throw docErr;
          }

          if (!docs) {
            return {
              id: `${braider.id}-pending`,
              braider_id: braider.id,
              braider_name: braider.full_name || 'Unknown',
              email: braider.email || '',
              phone: braider.phone || '',
              status: 'pending',
              document_type: 'Not submitted',
              document_url: null,
              submitted_at: new Date().toISOString(),
              verified_at: null,
              verified_by: null,
              notes: null,
            };
          }

          return {
            id: docs.id,
            braider_id: braider.id,
            braider_name: braider.full_name || 'Unknown',
            email: braider.email || '',
            phone: braider.phone || '',
            status: docs.status || 'pending',
            document_type: docs.document_type || 'Unknown',
            document_url: docs.document_url,
            submitted_at: docs.submitted_at,
            verified_at: docs.verified_at,
            verified_by: docs.verified_by,
            notes: docs.notes,
          };
        } catch (err) {
          console.error(`Error fetching verification for ${braider.id}:`, err);
          return {
            id: `${braider.id}-error`,
            braider_id: braider.id,
            braider_name: braider.full_name || 'Unknown',
            email: braider.email || '',
            phone: braider.phone || '',
            status: 'pending',
            document_type: 'Error loading',
            document_url: null,
            submitted_at: new Date().toISOString(),
            verified_at: null,
            verified_by: null,
            notes: null,
          };
        }
      })
    );

    return NextResponse.json(verifications);
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch verifications' },
      { status: 500 }
    );
  }
}
