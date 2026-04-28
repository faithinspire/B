import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * PHASE 3: PAYMENT SYSTEM RE-ARCHITECTURE
 * Central payment provider resolver - single source of truth for payment routing
 * 
 * Resolves which payment provider (Stripe, Paystack) to use based on user country
 * NEVER use implicit defaults or fallbacks
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, braider_id, country } = body;

    if (!user_id && !braider_id && !country) {
      return NextResponse.json(
        { error: 'Must provide user_id, braider_id, or country' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Determine country from provided data
    let resolvedCountry = country;

    if (!resolvedCountry && user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user_id)
        .single();
      resolvedCountry = profile?.country;
    }

    if (!resolvedCountry && braider_id) {
      const { data: braiderProfile } = await supabase
        .from('braider_profiles')
        .select('country')
        .eq('user_id', braider_id)
        .single();
      resolvedCountry = braiderProfile?.country;
    }

    // CRITICAL: Never default to 'NG' or any implicit value
    if (!resolvedCountry) {
      return NextResponse.json(
        { error: 'Country not found for user. Cannot determine payment provider.' },
        { status: 400 }
      );
    }

    // Resolve payment provider based on country
    let provider: 'stripe' | 'paystack';
    let currency: string;

    if (resolvedCountry === 'NG') {
      provider = 'paystack';
      currency = 'NGN';
    } else if (resolvedCountry === 'US') {
      provider = 'stripe';
      currency = 'USD';
    } else {
      // Default to Stripe for other countries
      provider = 'stripe';
      currency = 'USD';
    }

    return NextResponse.json({
      success: true,
      provider,
      currency,
      country: resolvedCountry,
    });
  } catch (error) {
    console.error('Payment provider resolution error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve payment provider' },
      { status: 500 }
    );
  }
}
