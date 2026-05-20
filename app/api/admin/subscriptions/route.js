import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/admin/subscriptions
// Query params: page, limit, status, plan, search
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;
    const status = searchParams.get('status') || '';  // active | inactive | cancelled | lapsed | past_due
    const plan   = searchParams.get('plan')   || '';  // monthly | yearly
    const search = searchParams.get('search') || '';

    // Build subscriptions query joined to users
    let query = supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        user_id,
        plan,
        status,
        amount,
        currency,
        stripe_customer_id,
        stripe_subscription_id,
        current_period_start,
        current_period_end,
        cancelled_at,
        created_at,
        updated_at,
        users (
          id,
          first_name,
          last_name,
          email,
          is_active,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (plan)   query = query.eq('plan', plan);

    const { data: subs, count, error: dbError } = await query;
    if (dbError) throw dbError;

    // Filter by user name/email in JS (Supabase doesn't support ilike on joined columns easily)
    let filtered = subs || [];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.users?.email?.toLowerCase().includes(q) ||
        s.users?.first_name?.toLowerCase().includes(q) ||
        s.users?.last_name?.toLowerCase().includes(q)
      );
    }

    // Summary stats (separate queries for speed)
    const [
      { count: totalActive },
      { count: totalMonthly },
      { count: totalYearly },
      { count: totalCancelled },
    ] = await Promise.all([
      supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('plan', 'monthly'),
      supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('plan', 'yearly'),
      supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    ]);

    // Estimate MRR: monthly subs * amount + yearly subs * (amount/12)
    const { data: activeAmounts } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, amount')
      .eq('status', 'active');

    const mrr = (activeAmounts || []).reduce((sum, s) => {
      const amt = parseFloat(s.amount) || 0;
      return sum + (s.plan === 'yearly' ? amt / 12 : amt);
    }, 0);

    return NextResponse.json({
      subscriptions: filtered,
      total: search ? filtered.length : (count || 0),
      page,
      totalPages: Math.ceil((search ? filtered.length : (count || 0)) / limit),
      stats: {
        totalActive:    totalActive    || 0,
        totalMonthly:   totalMonthly   || 0,
        totalYearly:    totalYearly    || 0,
        totalCancelled: totalCancelled || 0,
        mrr: parseFloat(mrr.toFixed(2)),
      },
    });
  } catch (err) {
    console.error('[admin/subscriptions GET]', err);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT  /api/admin/subscriptions
// Body: { id, status?, plan?, amount?, current_period_end? }
// Admin can manually override subscription fields (e.g. grant access, cancel)
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id, status, plan, amount, current_period_end, note } = await req.json();

    if (!id) return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });

    const validStatuses = ['active', 'inactive', 'cancelled', 'lapsed', 'past_due'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (status             !== undefined) updateData.status              = status;
    if (plan               !== undefined) updateData.plan                = plan;
    if (amount             !== undefined) updateData.amount              = parseFloat(amount);
    if (current_period_end !== undefined) updateData.current_period_end  = current_period_end;
    if (status === 'cancelled')           updateData.cancelled_at        = new Date().toISOString();

    const { data: sub, error: dbError } = await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        users ( id, first_name, last_name, email )
      `)
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, subscription: sub, note });
  } catch (err) {
    console.error('[admin/subscriptions PUT]', err);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

// Body: { user_id, plan, amount, status, current_period_end }
// Manually create a subscription record (e.g. offline/manual payment)
export async function POST(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { user_id, plan, amount, status = 'active', current_period_end } = await req.json();

    if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    if (!plan)    return NextResponse.json({ error: 'plan is required' }, { status: 400 });

    // Check user exists
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users').select('id, email').eq('id', user_id).single();
    if (userErr || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Deactivate any existing active subscription first
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('status', 'active');

    const now = new Date();
    const periodEnd = current_period_end || (
      plan === 'yearly'
        ? new Date(now.setFullYear(now.getFullYear() + 1)).toISOString()
        : new Date(now.setMonth(now.getMonth() + 1)).toISOString()
    );

    const { data: sub, error: insertErr } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id,
        plan,
        status,
        amount:                parseFloat(amount) || 0,
        currency:              'gbp',
        current_period_start:  new Date().toISOString(),
        current_period_end:    periodEnd,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true, subscription: sub });
  } catch (err) {
    console.error('[admin/subscriptions POST]', err);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE  /api/admin/subscriptions?id=xxx
// Hard-delete a subscription record
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 });

    const { error: dbError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/subscriptions DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }
}