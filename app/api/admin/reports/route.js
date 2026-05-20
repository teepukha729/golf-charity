import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    // Total users
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'subscriber');

    // Active subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status, amount, created_at');

    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
    const monthlyRevenue = activeSubscriptions.reduce((sum, s) => {
      return sum + (s.plan === 'monthly' ? 10 : 8); // yearly = 96/12 = 8/month
    }, 0);

    // Prize pool
    const totalPrizePool = monthlyRevenue * 0.60;

    // Charity contributions
    const { data: charityData } = await supabaseAdmin
      .from('user_charities')
      .select('contribution_percentage');

    const avgCharityPercent = charityData?.length
      ? charityData.reduce((sum, c) => sum + c.contribution_percentage, 0) / charityData.length
      : 10;

    const totalCharityThisMonth = monthlyRevenue * (avgCharityPercent / 100);

    // Draw statistics
    const { data: draws } = await supabaseAdmin
      .from('draws')
      .select('status, prize_pool_total, created_at')
      .order('created_at', { ascending: false });

    // Winners breakdown
    const { data: winners } = await supabaseAdmin
      .from('winners')
      .select('match_type, prize_amount, verification_status, payment_status, created_at');

    // Subscription trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: subTrends } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, created_at, status')
      .gte('created_at', sixMonthsAgo.toISOString());

    // Monthly subscriber counts
    const monthlyTrends = {};
    (subTrends || []).forEach(sub => {
      const month = sub.created_at.substring(0, 7); // YYYY-MM
      if (!monthlyTrends[month]) monthlyTrends[month] = { month, monthly: 0, yearly: 0, total: 0 };
      monthlyTrends[month][sub.plan]++;
      monthlyTrends[month].total++;
    });

    // Score distribution
    const { data: scores } = await supabaseAdmin
      .from('golf_scores')
      .select('score');

    const scoreFrequency = {};
    (scores || []).forEach(({ score }) => {
      scoreFrequency[score] = (scoreFrequency[score] || 0) + 1;
    });

    // Top charities by selection
    const { data: charitySelections } = await supabaseAdmin
      .from('user_charities')
      .select('charity_id, charities(name)')
      .not('charity_id', 'is', null);

    const charityCount = {};
    (charitySelections || []).forEach(sel => {
      const name = sel.charities?.name || 'Unknown';
      charityCount[name] = (charityCount[name] || 0) + 1;
    });

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions.length,
        monthlyRevenue: monthlyRevenue.toFixed(2),
        totalPrizePool: totalPrizePool.toFixed(2),
        totalCharityThisMonth: totalCharityThisMonth.toFixed(2),
        totalDraws: draws?.length || 0,
        publishedDraws: draws?.filter(d => d.status === 'published').length || 0,
        totalWinners: winners?.length || 0,
        pendingVerifications: winners?.filter(w => w.verification_status === 'pending').length || 0,
        pendingPayouts: winners?.filter(w => w.payment_status === 'pending' && w.verification_status === 'approved').length || 0,
      },
      subscriptionBreakdown: {
        monthly: activeSubscriptions.filter(s => s.plan === 'monthly').length,
        yearly: activeSubscriptions.filter(s => s.plan === 'yearly').length,
      },
      monthlyTrends: Object.values(monthlyTrends).sort((a, b) => a.month.localeCompare(b.month)),
      scoreDistribution: Object.entries(scoreFrequency).map(([score, count]) => ({
        score: parseInt(score),
        count,
      })).sort((a, b) => a.score - b.score),
      winnerBreakdown: {
        fiveMatch: winners?.filter(w => w.match_type === '5-match').length || 0,
        fourMatch: winners?.filter(w => w.match_type === '4-match').length || 0,
        threeMatch: winners?.filter(w => w.match_type === '3-match').length || 0,
      },
      topCharities: Object.entries(charityCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      drawHistory: draws?.slice(0, 10).map(d => ({
        status: d.status,
        prizePool: d.prize_pool_total,
        month: d.created_at.substring(0, 7),
      })) || [],
    });
  } catch (err) {
    console.error('Reports error:', err);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
