import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';
import DashboardOverviewClient from '@/components/subscriber/DashboardOverviewClient';

async function getDashboardData(userId) {
  const [subRes, scoresRes, charityRes, drawEntriesRes, winnersRes, nextDrawRes] = await Promise.all([
    supabaseAdmin.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
    supabaseAdmin.from('golf_scores').select('*').eq('user_id', userId).order('played_at', { ascending: false }).limit(5),
    supabaseAdmin.from('user_charities').select('*, charity:charities(name, logo_url)').eq('user_id', userId).single(),
    supabaseAdmin.from('draw_entries').select('*, draw:draws(name, draw_date, status)').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('winners').select('prize_amount, payment_status, verification_status').eq('user_id', userId),
    supabaseAdmin.from('draws').select('*').eq('status', 'pending').order('draw_date').limit(1).single(),
  ]);

  const totalWon = winnersRes.data?.reduce((s, w) => s + (w.prize_amount || 0), 0) || 0;
  const pendingPayout = winnersRes.data?.filter(w => w.verification_status === 'approved' && w.payment_status === 'pending').reduce((s, w) => s + (w.prize_amount || 0), 0) || 0;

  return {
    subscription: subRes.data || null,
    scores: scoresRes.data || [],
    charitySelection: charityRes.data || null,
    drawEntries: drawEntriesRes.data || [],
    totalWon,
    pendingPayout,
    totalDrawsEntered: drawEntriesRes.count || (drawEntriesRes.data?.length || 0),
    nextDraw: nextDrawRes.data || null,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await getDashboardData(session.user.id);

  return <DashboardOverviewClient user={session.user} {...data} />;
}
