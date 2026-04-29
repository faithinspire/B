import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { data: categories, error } = await supabase
      .from('marketplace_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Categories fetch error:', error);
      // Return empty array instead of error — marketplace still works without categories
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({
      success: true,
      data: categories || [],
    });
  } catch (err) {
    console.error('Categories API error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
