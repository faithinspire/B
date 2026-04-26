import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PLATFORM_FEE_PERCENT = 0.01; // 1%

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_id,
      quantity = 1,
      shipping_address,
      payment_method, // 'stripe' | 'paystack' | 'card'
      country_code,   // 'NG' | 'US'
    } = body;

    if (!product_id || !shipping_address) {
      return NextResponse.json(
        { success: false, error: 'product_id and shipping_address are required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // Verify user
    const anonClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid authentication' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Get product
    const { data: product, error: productError } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json({ success: false, error: 'Product not found or unavailable' }, { status: 404 });
    }

    if (product.stock_quantity < quantity) {
      return NextResponse.json({ success: false, error: 'Insufficient stock' }, { status: 400 });
    }

    // Calculate amounts
    const unit_price = product.price;
    const subtotal = unit_price * quantity;
    const platform_fee = Math.round(subtotal * PLATFORM_FEE_PERCENT * 100) / 100;
    const total_amount = subtotal; // buyer pays full price
    const seller_payout = subtotal - platform_fee; // seller gets 99%

    const currency = product.currency || (country_code === 'US' ? 'USD' : 'NGN');
    const order_number = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create order - use buyer_id (matches DB schema from add_marketplace_orders.sql)
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .insert({
        product_id,
        quantity,
        buyer_id: user.id,
        buyer_email: user.email || '',
        buyer_name: user.user_metadata?.full_name || user.email || '',
        seller_id: product.braider_id,
        product_name: product.name || '',
        product_image: product.image_url || null,
        unit_price,
        total_amount,
        currency,
        delivery_address: shipping_address,
        status: 'pending',
        payment_status: 'unpaid',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      // If buyer_id fails, try with customer_id as fallback
      if (orderError.message?.includes('buyer_id') || orderError.message?.includes('schema cache')) {
        const { data: order2, error: orderError2 } = await supabase
          .from('marketplace_orders')
          .insert({
            product_id,
            quantity,
            customer_id: user.id,
            seller_id: product.braider_id,
            product_name: product.name || '',
            unit_price,
            total_amount,
            currency,
            delivery_address: shipping_address,
            status: 'pending',
            payment_status: 'unpaid',
          })
          .select()
          .single();
        if (orderError2) {
          return NextResponse.json({ success: false, error: orderError2.message }, { status: 500 });
        }
        return NextResponse.json({
          success: true,
          data: {
            order_id: order2.id,
            order_number: order2.id.slice(0, 8).toUpperCase(),
            total_amount,
            platform_fee,
            seller_payout,
            currency,
            payment: null,
          },
        });
      }
      return NextResponse.json({ success: false, error: orderError.message }, { status: 500 });
    }

    // Try to create order item (non-critical - table may not exist)
    try {
      await supabase.from('marketplace_order_items').insert({
        order_id: order.id,
        product_id,
        quantity,
        unit_price,
        subtotal,
      });
    } catch (itemErr) {
      console.log('Note: Could not create order item (table may not exist):', itemErr);
    }

    // Reduce stock
    await supabase
      .from('marketplace_products')
      .update({ stock_quantity: product.stock_quantity - quantity })
      .eq('id', product_id);

    // Create payment intent based on country
    let paymentData: any = null;

    if (country_code === 'US' || currency === 'USD') {
      // Stripe for USA
      try {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (stripeKey && (stripeKey.startsWith('sk_test_') || stripeKey.startsWith('sk_live_'))) {
          const Stripe = (await import('stripe')).default;
          const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total_amount * 100),
            currency: 'usd',
            payment_method_types: ['card'],
            metadata: {
              order_id: order.id,
              order_number,
              product_id,
              customer_id: user.id,
              braider_id: product.braider_id,
              platform_fee: platform_fee.toString(),
              seller_payout: seller_payout.toString(),
            },
          });

          // Update order with payment intent
          await supabase
            .from('marketplace_orders')
            .update({ stripe_payment_intent_id: paymentIntent.id })
            .eq('id', order.id);

          paymentData = {
            provider: 'stripe',
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
          };
        }
      } catch (stripeErr) {
        console.error('Stripe error:', stripeErr);
        // Continue without payment intent - order still created
      }
    } else {
      // Paystack for Nigeria
      try {
        const paystackKey = process.env.PAYSTACK_SECRET_KEY;
        if (paystackKey) {
          const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${paystackKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email || 'customer@braidmee.com',
              amount: Math.round(total_amount * 100), // Paystack uses kobo
              currency: 'NGN',
              reference: order_number,
              metadata: {
                order_id: order.id,
                product_id,
                customer_id: user.id,
                braider_id: product.braider_id,
                platform_fee,
                seller_payout,
              },
              callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/marketplace/order-success?order=${order.id}`,
            }),
          });

          const paystackData = await paystackRes.json();
          if (paystackData.status) {
            await supabase
              .from('marketplace_orders')
              .update({ payment_id: paystackData.data.reference })
              .eq('id', order.id);

            paymentData = {
              provider: 'paystack',
              authorizationUrl: paystackData.data.authorization_url,
              reference: paystackData.data.reference,
            };
          }
        }
      } catch (paystackErr) {
        console.error('Paystack error:', paystackErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        order_id: order.id,
        order_number: order_number,
        total_amount,
        platform_fee,
        seller_payout,
        currency,
        payment: paymentData,
        // If no payment gateway configured, show bank transfer info
        payment_instructions: !paymentData ? {
          method: 'bank_transfer',
          message: 'Please complete payment via bank transfer. Your order will be processed upon confirmation.',
          amount: total_amount,
          currency,
        } : null,
      },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
