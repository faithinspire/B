import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Fetch all braiders with verification status
    const { data: braiders, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'braider')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching braiders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch braiders' },
        { status: 500 }
      );
    }

    // Fetch portfolio images for each braider
    const braiderIds = (braiders || []).map(b => b.id);
    let portfolioMap: Record<string, string[]> = {};

    if (braiderIds.length > 0) {
      const { data: portfolios } = await supabaseAdmin
        .from('braider_portfolio')
        .select('braider_id, image_url')
        .in('braider_id', braiderIds);

      if (portfolios) {
        portfolioMap = portfolios.reduce((acc, p) => {
          if (!acc[p.braider_id]) acc[p.braider_id] = [];
          acc[p.braider_id].push(p.image_url);
          return acc;
        }, {} as Record<string, string[]>);
      }
    }

    // Enrich braiders with portfolio images
    const enrichedBraiders = (braiders || []).map(b => ({
      ...b,
      portfolio_images: portfolioMap[b.id] || [],
    }));

    return NextResponse.json(enrichedBraiders);
  } catch (err) {
    console.error('Braiders API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
