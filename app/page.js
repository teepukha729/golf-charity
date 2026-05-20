import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import HomepageClient from '@/components/visitor/HomepageClient';

// Server-side data fetching for SEO and real stats
async function getHomepageStats() {
  try {
    const [usersRes, charitiesRes, drawsRes, winnersRes] = await Promise.all([
      supabaseAdmin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('charities').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('draws').select('prize_pool_total').eq('status', 'published'),
      supabaseAdmin.from('winners').select('prize_amount'),
    ]);

    const totalPrizePaid = winnersRes.data?.reduce((sum, w) => sum + (w.prize_amount || 0), 0) || 0;
    const totalPrizePool = drawsRes.data?.reduce((sum, d) => sum + (d.prize_pool_total || 0), 0) || 0;

    return {
      activeSubscribers: usersRes.count || 0,
      totalCharities: charitiesRes.count || 0,
      totalPrizePaid: totalPrizePaid.toFixed(0),
      totalPrizePool: totalPrizePool.toFixed(0),
    };
  } catch {
    return { activeSubscribers: 0, totalCharities: 0, totalPrizePaid: '0', totalPrizePool: '0' };
  }
}

async function getFeaturedCharities() {
  try {
    const { data } = await supabaseAdmin
      .from('charities')
      .select('id, name, description, logo_url, category, total_raised')
      .eq('is_featured', true)
      .eq('is_active', true)
      .limit(3);
    return data || [];
  } catch {
    return [];
  }
}

async function getLatestDraw() {
  try {
    const { data } = await supabaseAdmin
      .from('draws')
      .select('*')
      .eq('status', 'published')
      .order('draw_date', { ascending: false })
      .limit(1)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [stats, featuredCharities, latestDraw] = await Promise.all([
    getHomepageStats(),
    getFeaturedCharities(),
    getLatestDraw(),
  ]);

  return (
    <HomepageClient
      stats={stats}
      featuredCharities={featuredCharities}
      latestDraw={latestDraw}
    />
  );
}
