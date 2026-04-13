import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    // Get all braider profiles
    const { data: braiders, error: braiderError } = await supabase
      .from('braider_profiles')
      .select('user_id, full_name, email, verification_status, rating_avg, rating_count')
      .order('created_at', { ascending: false });

    if (braiderError || !braiders) {
      console.error('Braiders error:', braiderError);
      return NextResponse.json([]);
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
        braider_id: braider.user_id,
        braider_name: braider.full_name || 'Unknown',
        email: braider.email || '',
        phone: profile?.phone || '',
        status: braider.verification_status || 'unverified',
        rating: braider.rating_avg || 0,
        rating_count: braider.rating_count || 0,
        avatar_url: profile?.avatar_url || null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json([]);
  }
}
