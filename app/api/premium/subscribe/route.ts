import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Plans: monthly $89, annual $799 (~25% off)
const PLANS = {
  monthly: { amount: 8900, label: 'Monthly Premium', interval: 'month' as const },
  annual:  { amount: 79900, label: 'Annual Premium', interval: 'year' as const },
};

export async function POST(req: NextRequest) {
  try {
    const { braider_id, plan = 'monthly', success_url, cancel_url } = await req.json();

    if (!braider_id) return NextResponse.json({ error: 'braider_id required' }, { status: 400 });

    const supabase = db();

    // Get braider profile info
    const { data: profile } = await supabase.from('profiles').select('email,full_name').eq('id', braider_id).single();
    if (!profile) return NextResponse.json({ error: 'Braider not found' }, { status: 404 });

    const selectedPlan = PLANS[plan as keyof typeof PLANS] || PLANS.monthly;
    const stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    const hasStripe = stripeKey.startsWith('sk_') && stripeKey.length > 20;

    if (!hasStripe) {
      // Bypass mode — activate premium directly without Stripe
      const now = new Date();
      const expires = new Date(now);
      if (plan === 'annual') expires.setFullYear(expires.getFullYear() + 1);
      else expires.setMonth(expires.getMonth() + 1);

      await supabase.from('braider_profiles').update({
        is_premium: true,
        premium_since: now.toISOString(),
        premium_expires_at: expires.toISOString(),
        premium_plan: plan,
        blog_enabled: true,
        featured_order: 100,
      }).eq('id', braider_id);

      await supabase.from('premium_subscriptions').insert({
        braider_id,
        plan,
        amount_cents: selectedPlan.amount,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: expires.toISOString(),
      });

      return NextResponse.json({ bypass: true, activated: true, expires: expires.toISOString() });
    }

    // Real Stripe checkout
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
    let customerId = customers.data[0]?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name,
        metadata: { braider_id },
      });
      customerId = customer.id;
    }

    // Create price on the fly (or use a pre-created price ID from env)
    const price = await stripe.prices.create({
      unit_amount: selectedPlan.amount,
      currency: 'usd',
      recurring: { interval: selectedPlan.interval },
      product_data: { name: `BraidMe ${selectedPlan.label}` },
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL || ''}/braider/premium?success=1`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL || ''}/braider/premium?cancelled=1`,
      metadata: { braider_id, plan },
      subscription_data: { metadata: { braider_id, plan } },
    });

    return NextResponse.json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    console.error('Premium subscribe error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
