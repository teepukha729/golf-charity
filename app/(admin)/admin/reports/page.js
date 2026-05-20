'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, Users, Trophy, Heart, RefreshCw } from 'lucide-react';

const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false });

let Highcharts;
if (typeof window !== 'undefined') {
  Highcharts = require('highcharts');
}

const chartTheme = {
  chart: { backgroundColor: 'transparent', style: { fontFamily: 'Inter, sans-serif' } },
  title: { style: { color: '#e8f5e9', fontSize: '14px', fontWeight: '600' } },
  xAxis: { labels: { style: { color: '#7aad8a' } }, lineColor: '#1f3527', tickColor: '#1f3527', gridLineColor: '#1f3527' },
  yAxis: { labels: { style: { color: '#7aad8a' } }, gridLineColor: '#1f3527', title: { style: { color: '#7aad8a' } } },
  legend: { itemStyle: { color: '#7aad8a' }, itemHoverStyle: { color: '#ffffff' } },
  tooltip: { backgroundColor: '#172219', borderColor: '#2d5c3f', style: { color: '#e8f5e9' } },
  plotOptions: { series: { borderRadius: 4 } },
  credits: { enabled: false },
};

export default function AdminReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hcLoaded, setHcLoaded] = useState(false);

  useEffect(() => {
    import('highcharts').then(mod => {
      Highcharts = mod.default;
      setHcLoaded(true);
    });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/reports');
    const json = await res.json();
    if (res.ok) setData(json);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading || !hcLoaded) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-1">Reports & Analytics</h1>
          <p className="text-[#7aad8a] text-sm">Loading real-time platform data...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 rounded-xl loading-skeleton" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-72 rounded-xl loading-skeleton" />)}
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-[#7aad8a]">Failed to load reports</div>;

  const { overview, subscriptionBreakdown, monthlyTrends, scoreDistribution, winnerBreakdown, topCharities, drawHistory } = data;

  // Chart configs
  const subscriberTrendChart = {
    ...chartTheme,
    chart: { ...chartTheme.chart, type: 'column' },
    title: { ...chartTheme.title, text: 'Subscriber Growth (Last 6 Months)' },
    xAxis: { ...chartTheme.xAxis, categories: monthlyTrends.map(m => m.month) },
    yAxis: { ...chartTheme.yAxis, title: { text: 'New Subscribers', style: { color: '#7aad8a' } } },
    series: [
      { name: 'Monthly', data: monthlyTrends.map(m => m.monthly), color: '#4ade80' },
      { name: 'Yearly', data: monthlyTrends.map(m => m.yearly), color: '#d4af37' },
    ],
  };

  const scoreDistChart = {
    ...chartTheme,
    chart: { ...chartTheme.chart, type: 'column' },
    title: { ...chartTheme.title, text: 'Score Distribution (Stableford)' },
    xAxis: { ...chartTheme.xAxis, categories: scoreDistribution.map(s => s.score.toString()), title: { text: 'Score', style: { color: '#7aad8a' } } },
    yAxis: { ...chartTheme.yAxis, title: { text: 'Frequency', style: { color: '#7aad8a' } } },
    series: [{ name: 'Frequency', data: scoreDistribution.map(s => s.count), color: '#4ade80', colorByPoint: false }],
    plotOptions: { column: { color: '#4ade80' } },
  };

  const subBreakdownChart = {
    ...chartTheme,
    chart: { ...chartTheme.chart, type: 'pie' },
    title: { ...chartTheme.title, text: 'Subscription Breakdown' },
    plotOptions: {
      pie: {
        dataLabels: { enabled: true, style: { color: '#e8f5e9' } },
        showInLegend: true,
      },
    },
    series: [{
      name: 'Subscribers',
      data: [
        { name: 'Monthly', y: subscriptionBreakdown.monthly, color: '#4ade80' },
        { name: 'Yearly', y: subscriptionBreakdown.yearly, color: '#d4af37' },
      ],
    }],
  };

  const winnerBreakdownChart = {
    ...chartTheme,
    chart: { ...chartTheme.chart, type: 'pie' },
    title: { ...chartTheme.title, text: 'Winners by Tier' },
    plotOptions: {
      pie: {
        dataLabels: { enabled: true, style: { color: '#e8f5e9' } },
        showInLegend: true,
      },
    },
    series: [{
      name: 'Winners',
      data: [
        { name: '5-Match (Jackpot)', y: winnerBreakdown.fiveMatch, color: '#d4af37' },
        { name: '4-Match', y: winnerBreakdown.fourMatch, color: '#c0c0c0' },
        { name: '3-Match', y: winnerBreakdown.threeMatch, color: '#cd7f32' },
      ],
    }],
  };

  const charityChart = {
    ...chartTheme,
    chart: { ...chartTheme.chart, type: 'bar' },
    title: { ...chartTheme.title, text: 'Top Charities by Selection' },
    xAxis: { ...chartTheme.xAxis, categories: topCharities.map(c => c.name), type: 'category' },
    yAxis: { ...chartTheme.yAxis, title: { text: 'Selections', style: { color: '#7aad8a' } } },
    series: [{ name: 'Selections', data: topCharities.map(c => c.count), color: '#f87171' }],
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Reports & Analytics</h1>
          <p className="text-[#7aad8a] text-sm">Real-time platform statistics</p>
        </div>
        <button onClick={fetchData} className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Overview stats */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: overview.totalUsers, icon: Users, color: '#4ade80' },
          { label: 'Active Subscriptions', value: overview.activeSubscriptions, icon: Users, color: '#d4af37' },
          { label: 'Monthly Revenue', value: `£${overview.monthlyRevenue}`, icon: TrendingUp, color: '#a78bfa' },
          { label: 'Prize Pool', value: `£${overview.totalPrizePool}`, icon: Trophy, color: '#f59e0b' },
          { label: 'Charity Contributions', value: `£${overview.totalCharityThisMonth}`, icon: Heart, color: '#f87171' },
          { label: 'Total Draws', value: overview.totalDraws, icon: BarChart2, color: '#22d3ee' },
          { label: 'Total Winners', value: overview.totalWinners, icon: Trophy, color: '#4ade80' },
          { label: 'Pending Verifications', value: overview.pendingVerifications, icon: Users, color: '#f87171' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
            </div>
            <div className="text-xl font-display font-bold text-white mb-1">{s.value}</div>
            <div className="text-xs text-[#7aad8a]">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subscriber growth */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
          {monthlyTrends.length > 0 ? (
            <HighchartsReact highcharts={Highcharts} options={subscriberTrendChart} />
          ) : (
            <div className="h-64 flex items-center justify-center text-[#7aad8a] text-sm">No trend data yet</div>
          )}
        </motion.div>

        {/* Score distribution */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="stat-card">
          {scoreDistribution.length > 0 ? (
            <HighchartsReact highcharts={Highcharts} options={scoreDistChart} />
          ) : (
            <div className="h-64 flex items-center justify-center text-[#7aad8a] text-sm">No score data yet</div>
          )}
        </motion.div>

        {/* Subscription breakdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card">
          {subscriptionBreakdown.monthly + subscriptionBreakdown.yearly > 0 ? (
            <HighchartsReact highcharts={Highcharts} options={subBreakdownChart} />
          ) : (
            <div className="h-64 flex items-center justify-center text-[#7aad8a] text-sm">No subscription data yet</div>
          )}
        </motion.div>

        {/* Winner breakdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="stat-card">
          {winnerBreakdown.fiveMatch + winnerBreakdown.fourMatch + winnerBreakdown.threeMatch > 0 ? (
            <HighchartsReact highcharts={Highcharts} options={winnerBreakdownChart} />
          ) : (
            <div className="h-64 flex items-center justify-center text-[#7aad8a] text-sm">No winner data yet</div>
          )}
        </motion.div>

        {/* Top charities */}
        {topCharities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="stat-card md:col-span-2">
            <HighchartsReact highcharts={Highcharts} options={charityChart} />
          </motion.div>
        )}
      </div>

      {/* Draw history table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="stat-card mt-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-[#d4af37]" /> Draw History Summary</h3>
        {drawHistory.length === 0 ? (
          <div className="text-center py-8 text-[#7aad8a] text-sm">No draws yet</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Month</th><th>Status</th><th>Prize Pool</th></tr>
            </thead>
            <tbody>
              {drawHistory.map((d, i) => (
                <tr key={i}>
                  <td className="text-white">{d.month}</td>
                  <td><span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'published' ? 'badge-active' : d.status === 'simulated' ? 'badge-pending' : 'border border-[#1f3527] text-[#7aad8a]'}`}>{d.status}</span></td>
                  <td className="text-[#d4af37] font-semibold">£{(d.prizePool || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
