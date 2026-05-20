import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail, emailTemplates } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  console.log('================ WEBHOOK START =================');

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe signature');
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('Webhook verified:', event.type);

  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);

    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {

    switch (event.type) {

      // =========================================================
      // CHECKOUT COMPLETED
      // =========================================================
      case 'checkout.session.completed': {

        console.log('Processing checkout.session.completed');

        const session = event.data.object;

        const metadata = session.metadata || {};

        const userId = metadata.userId;
        const plan = metadata.plan;
        const subscriptionId = session.subscription;

        console.log('USER ID:', userId, 'PLAN:', plan, 'SUBSCRIPTION ID:', subscriptionId);

        if (!userId) {
          console.error('Missing userId in session metadata');
          break;
        }

        if (!subscriptionId) {
          console.error('Missing subscriptionId');
          break;
        }

        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

        const subscriptionData = {
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: subscriptionId,
          plan: plan || 'monthly',
          status: 'active',
          amount: plan === 'yearly' ? 96.0 : 10.0,
          currency: 'gbp',
          current_period_start: new Date(
            stripeSubscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            stripeSubscription.current_period_end * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: savedSub, error: subError } = await supabaseAdmin
          .from('subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'user_id',
          })
          .select()
          .single();

        if (subError) {
          console.error('SUPABASE UPSERT ERROR:', subError);
          return NextResponse.json(
            { error: 'Database insert failed', details: subError },
            { status: 500 }
          );
        }

        console.log('SUBSCRIPTION SAVED SUCCESSFULLY:', savedSub?.id);

        // =========================================================
        // BUG FIX: Populate charity_donations when subscription is created
        // =========================================================
        try {
          const subAmount = plan === 'yearly' ? 96.0 : 10.0;

          // Get user's charity selection
          const { data: userCharity } = await supabaseAdmin
            .from('user_charities')
            .select('charity_id, contribution_percentage')
            .eq('user_id', userId)
            .single();

          if (userCharity?.charity_id) {
            const donationAmount = subAmount * (userCharity.contribution_percentage / 100);

            await supabaseAdmin.from('charity_donations').insert({
              user_id: userId,
              charity_id: userCharity.charity_id,
              amount: donationAmount,
              donation_type: 'subscription',
              stripe_payment_intent_id: session.payment_intent || null,
            });

            // Update charity total_raised
            await supabaseAdmin.rpc('increment_charity_total', {
              p_charity_id: userCharity.charity_id,
              p_amount: donationAmount,
            }).catch(() => {
              // rpc may not exist — do a manual update instead
              supabaseAdmin
                .from('charities')
                .select('total_raised')
                .eq('id', userCharity.charity_id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    supabaseAdmin
                      .from('charities')
                      .update({ total_raised: (data.total_raised || 0) + donationAmount })
                      .eq('id', userCharity.charity_id);
                  }
                });
            });

            console.log('CHARITY DONATION RECORDED:', donationAmount);
          }
        } catch (charityErr) {
          console.error('CHARITY DONATION ERROR (non-fatal):', charityErr);
        }

        // Send subscription email
        try {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('email, first_name')
            .eq('id', userId)
            .single();

          if (user?.email) {
            const template = emailTemplates.subscriptionActive(
              user.first_name || 'User',
              plan || 'monthly'
            );
            await sendEmail({ to: user.email, ...template });
            console.log('EMAIL SENT');
          }
        } catch (emailError) {
          console.error('EMAIL ERROR:', emailError);
        }

        break;
      }

      // =========================================================
      // PAYMENT SUCCEEDED (renewal) — record recurring donation
      // =========================================================
      case 'invoice.payment_succeeded': {
        console.log('invoice.payment_succeeded');

        const invoice = event.data.object;

        if (invoice.subscription) {
          // Update subscription status
          const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('user_id, plan, amount')
            .eq('stripe_subscription_id', invoice.subscription)
            .single();

          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription);

          // BUG FIX: Record charity donation on each renewal payment too
          if (sub?.user_id && invoice.billing_reason === 'subscription_cycle') {
            try {
              const { data: userCharity } = await supabaseAdmin
                .from('user_charities')
                .select('charity_id, contribution_percentage')
                .eq('user_id', sub.user_id)
                .single();

              if (userCharity?.charity_id) {
                const subAmount = sub.plan === 'yearly' ? 96.0 : 10.0;
                const donationAmount = subAmount * (userCharity.contribution_percentage / 100);

                await supabaseAdmin.from('charity_donations').insert({
                  user_id: sub.user_id,
                  charity_id: userCharity.charity_id,
                  amount: donationAmount,
                  donation_type: 'subscription',
                  stripe_payment_intent_id: invoice.payment_intent || null,
                });

                // Update charity total_raised
                const { data: charity } = await supabaseAdmin
                  .from('charities')
                  .select('total_raised')
                  .eq('id', userCharity.charity_id)
                  .single();

                if (charity) {
                  await supabaseAdmin
                    .from('charities')
                    .update({ total_raised: (charity.total_raised || 0) + donationAmount })
                    .eq('id', userCharity.charity_id);
                }
              }
            } catch (err) {
              console.error('Renewal charity donation error (non-fatal):', err);
            }
          }
        }

        break;
      }

      // =========================================================
      // PAYMENT FAILED
      // =========================================================
      case 'invoice.payment_failed': {
        console.log('invoice.payment_failed');

        const invoice = event.data.object;

        if (invoice.subscription) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription);
        }

        break;
      }

      // =========================================================
      // SUBSCRIPTION UPDATED
      // =========================================================
      case 'customer.subscription.updated': {
        console.log('customer.subscription.updated');

        const sub = event.data.object;

        const status =
          sub.status === 'active'
            ? 'active'
            : sub.status === 'past_due'
            ? 'past_due'
            : sub.status === 'canceled'
            ? 'cancelled'
            : 'inactive';

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        break;
      }

      // =========================================================
      // SUBSCRIPTION CANCELLED
      // =========================================================
      case 'customer.subscription.deleted': {
        console.log('customer.subscription.deleted');

        const sub = event.data.object;

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }

    console.log('================ WEBHOOK SUCCESS =================');

    return NextResponse.json({ received: true, success: true });

  } catch (err) {
    console.error('================ WEBHOOK FATAL ERROR =================');
    console.error(err);

    return NextResponse.json(
      { error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
