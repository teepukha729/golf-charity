import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, requireSubscriber } from '@/lib/auth';
import { generateRandomDraw, generateAlgorithmicDraw, processDraw } from '@/lib/drawEngine';
import { sendEmail, emailTemplates } from '@/lib/email';
import { calculatePrizePool } from '@/lib/stripe';

// GET - list draws (public: only published; admin: all)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const isAdmin = searchParams.get('admin') === 'true';
  const drawId = searchParams.get('id');

  if (drawId) {
    const { data: draw, error } = await supabaseAdmin
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .single();

    if (error) return NextResponse.json({ error: 'Draw not found' }, { status: 404 });
    return NextResponse.json({ draw });
  }

  let query = supabaseAdmin
    .from('draws')
    .select('*')
    .order('draw_date', { ascending: false });

  if (!isAdmin) {
    query = query.eq('status', 'published');
  }

  const { data: draws, error } = await query.limit(20);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch draws' }, { status: 500 });
  }

  return NextResponse.json({ draws });
}

// POST - admin: create draw
export async function POST(req) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { name, drawDate, drawType } = body;

    if (!name || !drawDate) {
      return NextResponse.json({ error: 'Name and draw date required' }, { status: 400 });
    }

    // Calculate prize pool from active subscribers
    const { data: subscribers } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, amount')
      .eq('status', 'active');

    const monthlyCount = subscribers?.filter(s => s.plan === 'monthly').length || 0;
    const yearlyCount = subscribers?.filter(s => s.plan === 'yearly').length || 0;

    // Monthly contribution averages
    const monthlyRevenue = monthlyCount * 10 + yearlyCount * 8;
    const prizePoolRevenue = monthlyRevenue * 0.60;

    // Check for rollover from previous draw
    const { data: lastDraw } = await supabaseAdmin
      .from('draws')
      .select('jackpot_amount, jackpot_rolled_over')
      .eq('status', 'published')
      .order('draw_date', { ascending: false })
      .limit(1)
      .single();

    const rolloverAmount = (lastDraw?.jackpot_rolled_over && lastDraw?.jackpot_amount) ? lastDraw.jackpot_amount : 0;

    const jackpotPool = prizePoolRevenue * 0.40 + rolloverAmount;
    const fourMatchPool = prizePoolRevenue * 0.35;
    const threeMatchPool = prizePoolRevenue * 0.25;

    const { data: draw, error: dbError } = await supabaseAdmin
      .from('draws')
      .insert({
        name,
        draw_date: drawDate,
        draw_type: drawType || 'random',
        status: 'pending',
        winning_numbers: [],
        prize_pool_total: prizePoolRevenue,
        jackpot_amount: jackpotPool,
        four_match_amount: fourMatchPool,
        three_match_amount: threeMatchPool,
        rollover_amount: rolloverAmount,
        participant_count: 0,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Failed to create draw' }, { status: 500 });
    }

    return NextResponse.json({ success: true, draw });
  } catch (err) {
    console.error('Draw POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - admin: simulate or publish draw
export async function PUT(req) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { id, action, drawType } = body;

    if (!id) return NextResponse.json({ error: 'Draw ID required' }, { status: 400 });

    const { data: draw } = await supabaseAdmin
      .from('draws')
      .select('*')
      .eq('id', id)
      .single();

    if (!draw) return NextResponse.json({ error: 'Draw not found' }, { status: 404 });

    if (action === 'simulate') {
      // Generate winning numbers
      const winningNumbers = drawType === 'algorithmic'
        ? await generateAlgorithmicDraw()
        : generateRandomDraw();

      // BUG FIX: Update winning_numbers in DB FIRST, then call processDraw
      // processDraw re-fetches the draw from DB so the numbers must be saved first
      const { error: updateError } = await supabaseAdmin
        .from('draws')
        .update({
          winning_numbers: winningNumbers,
          draw_type: drawType || draw.draw_type,
          status: 'simulated',
        })
        .eq('id', id);

      if (updateError) {
        console.error('Draw update error:', updateError);
        return NextResponse.json({ error: 'Failed to update draw' }, { status: 500 });
      }

      // Now process - the draw in DB has winning_numbers set
      let result;
      try {
        result = await processDraw(id);
      } catch (processErr) {
        console.error('processDraw error:', processErr);
        return NextResponse.json({ error: processErr.message || 'Failed to process draw' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        winningNumbers,
        result,
      });
    }

    if (action === 'publish') {
      if (draw.status !== 'simulated') {
        return NextResponse.json({ error: 'Draw must be simulated before publishing' }, { status: 400 });
      }

      await supabaseAdmin
        .from('draws')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', id);

      // Notify winners
      const { data: winners } = await supabaseAdmin
        .from('winners')
        .select('*, user:users(email, first_name, last_name)')
        .eq('draw_id', id);

      for (const winner of (winners || [])) {
        if (!winner.user?.email) continue;
        const emailTemplate = emailTemplates.drawResults(
          `${winner.user.first_name} ${winner.user.last_name}`,
          winner.match_type,
          winner.prize_amount.toFixed(2)
        );
        sendEmail({ to: winner.user.email, ...emailTemplate }).catch(console.error);
      }

      return NextResponse.json({ success: true, publishedAt: new Date().toISOString() });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Draw PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
