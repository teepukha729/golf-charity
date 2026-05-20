import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import stripe from '@/lib/stripe';

export async function GET(req) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { data: subscription, error: dbError } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (dbError && dbError.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }

  return NextResponse.json({ subscription: subscription || null });
}

// Cancel subscription
export async function DELETE(req) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

  if (!subscription) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
  }

  try {
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancellation error:', err);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
