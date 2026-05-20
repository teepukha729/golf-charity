import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { Users, Trophy, Heart, Award, ArrowRight, AlertCircle } from 'lucide-react';

async function getAdminStats() {
  const [usersRes, subRes, drawsRes, winnersRes, charitiesRes] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'subscriber'),
    supabaseAdmin.from('subscriptions').select('plan, status'),
    supabaseAdmin.from('draws').select('status, prize_pool_total'),
    supabaseAdmin.from('winners').select('verification_status, payment_status, prize_amount'),
    supabaseAdmin.from('charities').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const subs = subRes.data || [];
  const activeSubs = subs.filter(s => s.status === 'active');
  const monthlyRevenue = activeSubs.reduce((s, sub) => s + (sub.plan === 'monthly' ? 10 : 8), 0);
  const winners = winnersRes.data || [];

  return {
    totalUsers: usersRes.count || 0,
    activeSubscriptions: activeSubs.length,
    monthlyRevenue: monthlyRevenue.toFixed(2),
    prizePool: (monthlyRevenue * 0.6).toFixed(2),
    pendingVerifications: winners.filter(w => w.verification_status === 'pending').length,
    pendingPayouts: winners.filter(w => w.verification_status === 'approved' && w.payment_status === 'pending').length,
    totalDraws: (drawsRes.data || []).length,
    publishedDraws: (drawsRes.data || []).filter(d => d.status === 'published').length,
    totalCharities: charitiesRes.count || 0,
    totalPrizeDistributed: winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + (w.prize_amount || 0), 0).toFixed(2),
  };
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  const statCards = [
    { label: 'Total Subscribers', value: stats.totalUsers, icon: Users, color: '#4ade80', href: '/admin/users' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: Users, color: '#d4af37', href: '/admin/users' },
    { label: 'Monthly Revenue', value: `£${stats.monthlyRevenue}`, icon: Trophy, color: '#a78bfa', href: '/admin/reports' },
    { label: 'Current Prize Pool', value: `£${stats.prizePool}`, icon: Trophy, color: '#f59e0b', href: '/admin/draws' },
    { label: 'Charities', value: stats.totalCharities, icon: Heart, color: '#f87171', href: '/admin/charities' },
    { label: 'Total Draws', value: stats.totalDraws, icon: Trophy, color: '#22d3ee', href: '/admin/draws' },
    { label: 'Prizes Distributed', value: `£${stats.totalPrizeDistributed}`, icon: Award, color: '#4ade80', href: '/admin/winners' },
    { label: 'Pending Verifications', value: stats.pendingVerifications, icon: AlertCircle, color: '#f87171', href: '/admin/winners' },
  ];

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-1">Admin Overview</h1>
        <p className="text-[#7aad8a] text-sm">Platform management and real-time statistics</p>
      </div>

      {/* Alerts */}
      {stats.pendingVerifications > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-[#f87171]/30 bg-[#1a1212] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#f87171] flex-shrink-0" />
            <div>
              <div className="text-sm text-white font-semibold">{stats.pendingVerifications} winner(s) awaiting verification</div>
              <div className="text-xs text-[#7aad8a]">Review proof submissions to process payouts</div>
            </div>
          </div>
          <Link href="/admin/winners" className="btn-primary text-xs py-2 px-4 flex-shrink-0">Review Now</Link>
        </div>
      )}

      {stats.pendingPayouts > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-[#f59e0b40] bg-[#1a1600] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-[#f59e0b] flex-shrink-0" />
            <div>
              <div className="text-sm text-white font-semibold">{stats.pendingPayouts} approved winner(s) awaiting payment</div>
              <div className="text-xs text-[#7aad8a]">Process payouts to complete winner settlements</div>
            </div>
          </div>
          <Link href="/admin/winners" className="btn-primary text-xs py-2 px-4 flex-shrink-0">Process Payouts</Link>
        </div>
      )}

      {/* Stats grid — 2 cols on mobile, 4 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {statCards.map((card, i) => (
          <Link key={i} href={card.href}>
            <div className="stat-card card-hover group cursor-pointer h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20`, border: `1px solid ${card.color}40` }}>
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <ArrowRight className="w-3 h-3 text-[#2d5c3f] group-hover:text-[#4ade80] transition-colors" />
              </div>
              <div className="text-lg md:text-xl font-display font-bold text-white mb-1 break-words">{card.value}</div>
              <div className="text-xs text-[#7aad8a] leading-tight">{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="stat-card">
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Create Draw', href: '/admin/draws', color: '#d4af37' },
            { label: 'Manage Users', href: '/admin/users', color: '#4ade80' },
            { label: 'Add Charity', href: '/admin/charities', color: '#f87171' },
            { label: 'View Reports', href: '/admin/reports', color: '#a78bfa' },
          ].map((action, i) => (
            <Link key={i} href={action.href}
              className="p-3 md:p-4 rounded-xl border border-[#1f3527] hover:border-[#2d5c3f] text-center text-sm font-medium transition-all hover:bg-[#172219]"
              style={{ color: action.color }}>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
