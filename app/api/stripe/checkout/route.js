import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import stripe from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { error, session } = await requireAuth();

  if (error) {
    return error;
  }

  try {

    const body = await req.json();

    const { plan } = body;

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    // Get user details

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      console.error('USER FETCH ERROR:', userError);

      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get existing subscription

    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    let customerId = existingSubscription?.stripe_customer_id;

    // Create stripe customer if not exists

    if (!customerId) {

      console.log('Creating new Stripe customer');

      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        metadata: {
          userId: session.user.id,
        },
      });

      customerId = customer.id;

      console.log('STRIPE CUSTOMER CREATED:', customerId);
    }

    // Select stripe price id

    let priceId = '';

    if (plan === 'monthly') {
      priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
    }

    if (plan === 'yearly') {
      priceId = process.env.STRIPE_YEARLY_PRICE_ID;
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe price id missing' },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    // Create stripe checkout session

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',

      customer: customerId,

      payment_method_types: ['card'],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      success_url: `${baseUrl}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${baseUrl}/subscribe?cancelled=true`,

      metadata: {
        userId: session.user.id,
        plan,
      },

      subscription_data: {
        metadata: {
          userId: session.user.id,
          plan,
        },
      },

      allow_promotion_codes: true,

      billing_address_collection: 'required',
    });

    console.log('CHECKOUT SESSION CREATED:', checkoutSession.id);

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (err) {

    console.error('CHECKOUT ERROR:', err);

    return NextResponse.json(
      {
        error: err.message || 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}