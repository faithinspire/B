import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // Get all braider profiles
    const { data: braiders, error: braiderError } = await supabase
      .from('braider_profiles')
      .select('user_id, full_name, email, verification_status, rating_avg, rating_count, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (braiderError || !braiders) {
      console.error('Braiders error:', braiderError);
      return NextResponse.json({ braiders: [], stats: { total: 0, pending: 0, approved: 0, rejected: 0 } });
    }

    // Get profile info for each braider
    const userIds = braiders.map(b => b.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, phone, avatar_url')
      .in('id', userIds);

    const profileMap = Object.fromEntries(
      (profiles || []).map(p => [p.id, p])
    );

    // Combine data
    const result = braiders.map(braider => {
      const profile = profileMap[braider.user_id];
      return {
        id: braider.user_id,
        user_id: braider.user_id,
        email: braider.email || '',
        full_name: braider.full_name || 'Unknown',
        phone: profile?.phone || '',
        verification_status: braider.verification_status || 'pending',
        rating: braider.rating_avg || 0,
        rating_count: braider.rating_count || 0,
        avatar_url: profile?.avatar_url || null,
        created_at: braider.created_at,
        updated_at: braider.updated_at,
      };
    });

    // Calculate stats
    const stats = {
      total: result.length,
      pending: result.filter(b => b.verification_status === 'pending').length,
      approved: result.filter(b => b.verification_status === 'approved').length,
      rejected: result.filter(b => b.verification_status === 'rejected').length,
    };

    return NextResponse.json({ braiders: result, stats });
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json({ braiders: [], stats: { total: 0, pending: 0, approved: 0, rejected: 0 } });
  }
}
