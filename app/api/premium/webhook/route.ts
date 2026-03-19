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

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_PREMIUM_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: any;

  try {
    const stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!stripeKey.startsWith('sk_')) {
      return NextResponse.json({ received: true, note: 'no stripe key' });
    }
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = db();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const braider_id = session.metadata?.braider_id;
        const plan = session.metadata?.plan || 'monthly';
        if (!braider_id) break;

        const now = new Date();
        const expires = new Date(now);
        if (plan === 'annual') expires.setFullYear(expires.getFullYear() + 1);
        else expires.setMonth(expires.getMonth() + 1);

        await supabase.from('braider_profiles').update({
          is_premium: true,
          premium_since: now.toISOString(),
          premium_expires_at: expires.toISOString(),
          premium_plan: plan,
          premium_stripe_subscription_id: session.subscription,
          blog_enabled: true,
          featured_order: 100,
        }).eq('id', braider_id);

        await supabase.from('premium_subscriptions').upsert({
          braider_id,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          plan,
          amount_cents: plan === 'annual' ? 79900 : 8900,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: expires.toISOString(),
          updated_at: now.toISOString(),
        }, { onConflict: 'braider_id' });
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const sub = event.data.object;
        const braider_id = sub.metadata?.braider_id;
        if (!braider_id) break;

        await supabase.from('braider_profiles').update({
          is_premium: false,
          premium_expires_at: new Date().toISOString(),
          featured_order: 0,
          blog_enabled: false,
        }).eq('id', braider_id);

        await supabase.from('premium_subscriptions').update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        }).eq('braider_id', braider_id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const sub_id = invoice.subscription;
        if (!sub_id) break;

        await supabase.from('premium_subscriptions').update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', sub_id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const sub_id = invoice.subscription;
        if (!sub_id) break;

        const { data: sub } = await supabase
          .from('premium_subscriptions')
          .select('braider_id, plan')
          .eq('stripe_subscription_id', sub_id)
          .single();

        if (sub) {
          const now = new Date();
          const expires = new Date(now);
          if (sub.plan === 'annual') expires.setFullYear(expires.getFullYear() + 1);
          else expires.setMonth(expires.getMonth() + 1);

          await supabase.from('braider_profiles').update({
            is_premium: true,
            premium_expires_at: expires.toISOString(),
            featured_order: 100,
            blog_enabled: true,
          }).eq('id', sub.braider_id);

          await supabase.from('premium_subscriptions').update({
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: expires.toISOString(),
            updated_at: now.toISOString(),
          }).eq('stripe_subscription_id', sub_id);
        }
        break;
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err);
  }

  return NextResponse.json({ received: true });
}
