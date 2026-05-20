'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { Target, Heart, Trophy, Gift, ArrowRight, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

function StatCard({ icon: Icon, label, value, sub, color = '#4ade80', href }) {
  const content = (
    <motion.div variants={fadeUp} className="stat-card card-hover group cursor-pointer h-full">
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color }} />
        </div>
        {href && <ArrowRight className="w-4 h-4 text-[#2d5c3f] group-hover:text-[#4ade80] transition-colors" />}
      </div>
      <div className="text-xl md:text-2xl font-display font-bold text-white mb-1 break-words leading-tight">{value}</div>
      <div className="text-xs md:text-sm font-medium text-white mb-1 leading-tight">{label}</div>
      {sub && <div className="text-xs text-[#7aad8a] leading-tight">{sub}</div>}
    </motion.div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardOverviewClient({
  user, subscription, scores, charitySelection, drawEntries, totalWon, pendingPayout, nextDraw
}) {
  const isActive = subscription?.status === 'active';
  const renewalDate = subscription?.current_period_end
    ? format(new Date(subscription.current_period_end), 'dd MMM yyyy')
    : null;

  return (
    <div className="pt-4 md:pt-0">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6 md:mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-1">
          Good day, {user.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-[#7aad8a] text-sm">Here's your platform overview</p>
      </motion.div>

      {/* Subscription status banner */}
      {!isActive && user.role !== 'admin' && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-5 p-4 rounded-xl border border-[#f59e0b40] bg-[#1a1600] flex flex-wrap items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#f59e0b] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-[#f59e0b] font-semibold">Subscription {subscription?.status || 'inactive'}</div>
            <div className="text-xs text-[#7a6a30]">Renew your subscription to participate in draws</div>
          </div>
          <Link href="/subscribe" className="btn-primary text-xs py-2 px-4 flex-shrink-0">Renew</Link>
        </motion.div>
      )}

      {/* Stat grid — 2 cols on mobile, 4 on lg */}
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard icon={Target} label="Scores Entered" value={scores.length} sub="of 5 maximum" color="#4ade80" href="/dashboard/scores" />
        <StatCard icon={Trophy} label="Draws Entered" value={drawEntries.length} sub="total participation" color="#d4af37" href="/dashboard/draws" />
        <StatCard icon={Gift} label="Total Won" value={`£${totalWon.toFixed(2)}`} sub={pendingPayout > 0 ? `£${pendingPayout.toFixed(2)} pending` : 'all time'} color="#a78bfa" href="/dashboard/winnings" />
        <StatCard icon={Heart} label="Charity" value={charitySelection?.charity?.name || 'Not set'} sub={charitySelection ? `${charitySelection.contribution_percentage}% contribution` : 'Choose one'} color="#f87171" href="/dashboard/charity" />
      </motion.div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-5">
        {/* Scores */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><Target className="w-4 h-4 text-[#4ade80]" /> My Scores</h2>
            <Link href="/dashboard/scores" className="text-xs text-[#4ade80] hover:underline">Manage →</Link>
          </div>
          {scores.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-10 h-10 mx-auto text-[#2d5c3f] mb-3" />
              <p className="text-sm text-[#7aad8a] mb-4">No scores entered yet</p>
              <Link href="/dashboard/scores" className="btn-primary text-xs py-2 px-4">Enter First Score</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[#172219] border border-[#1f3527]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a472a] to-[#2d6a4f] flex items-center justify-center text-sm font-bold text-[#4ade80] flex-shrink-0">{s.score}</div>
                    <div>
                      <div className="text-sm text-white font-medium">Stableford {s.score}</div>
                      <div className="text-xs text-[#7aad8a]">{format(new Date(s.played_at), 'dd MMM yyyy')}</div>
                    </div>
                  </div>
                  {i === 0 && <span className="text-xs badge-active px-2 py-0.5 rounded-full flex-shrink-0">Latest</span>}
                </div>
              ))}
              {scores.length < 5 && (
                <Link href="/dashboard/scores" className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#2d5c3f] text-[#7aad8a] text-xs hover:border-[#4ade80] hover:text-[#4ade80] transition-all">
                  + Add score ({5 - scores.length} remaining)
                </Link>
              )}
            </div>
          )}
        </motion.div>

        {/* Subscription + Next Draw */}
        <div className="space-y-4">
          {/* Subscription */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="stat-card">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-[#d4af37]" /> Subscription</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#7aad8a]">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {subscription?.status || 'Inactive'}
                </span>
              </div>
              {subscription?.plan && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#7aad8a]">Plan</span>
                  <span className="text-white capitalize">{subscription.plan}</span>
                </div>
              )}
              {renewalDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#7aad8a]">Renews</span>
                  <span className="text-white">{renewalDate}</span>
                </div>
              )}
              {!isActive && (
                <Link href="/subscribe" className="btn-accent w-full justify-center text-xs py-2 mt-2">Activate Subscription</Link>
              )}
            </div>
          </motion.div>

          {/* Next Draw */}
          {nextDraw && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="stat-card border-[#d4af3730]">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-[#d4af37]" /> Next Draw</h2>
              <div className="text-base md:text-lg font-semibold text-white mb-1">{nextDraw.name}</div>
              <div className="text-sm text-[#7aad8a] mb-3">
                {format(new Date(nextDraw.draw_date), 'dd MMMM yyyy')} — {formatDistanceToNow(new Date(nextDraw.draw_date), { addSuffix: true })}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-[#172219]">
                  <div className="text-[#d4af37] font-bold">£{(nextDraw.jackpot_amount || 0).toFixed(0)}</div>
                  <div className="text-[#7aad8a]">Jackpot</div>
                </div>
                <div className="p-2 rounded-lg bg-[#172219]">
                  <div className="text-[#c0c0c0] font-bold">£{(nextDraw.four_match_amount || 0).toFixed(0)}</div>
                  <div className="text-[#7aad8a]">4-Match</div>
                </div>
                <div className="p-2 rounded-lg bg-[#172219]">
                  <div className="text-[#cd7f32] font-bold">£{(nextDraw.three_match_amount || 0).toFixed(0)}</div>
                  <div className="text-[#7aad8a]">3-Match</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Recent draw entries */}
      {drawEntries.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#a78bfa]" /> Recent Draw Entries</h2>
            <Link href="/dashboard/draws" className="text-xs text-[#4ade80] hover:underline">View all →</Link>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Draw</th>
                  <th>Date</th>
                  <th>My Numbers</th>
                  <th>Matches</th>
                  <th>Prize</th>
                </tr>
              </thead>
              <tbody>
                {drawEntries.slice(0, 5).map(entry => (
                  <tr key={entry.id}>
                    <td className="text-white">{entry.draw?.name || '—'}</td>
                    <td className="text-[#7aad8a]">{entry.draw?.draw_date ? format(new Date(entry.draw.draw_date), 'dd MMM yy') : '—'}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {entry.entry_numbers?.map((n, i) => (
                          <span key={i} className="w-6 h-6 rounded-full bg-[#1f3527] text-[#4ade80] text-xs flex items-center justify-center font-bold">{n}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`text-xs font-semibold ${entry.match_count >= 5 ? 'text-[#d4af37]' : entry.match_count >= 4 ? 'text-[#c0c0c0]' : entry.match_count >= 3 ? 'text-[#cd7f32]' : 'text-[#7aad8a]'}`}>
                        {entry.match_count || 0}
                      </span>
                    </td>
                    <td>
                      {entry.prize_amount > 0
                        ? <span className="text-[#4ade80] font-semibold">£{entry.prize_amount.toFixed(2)}</span>
                        : <span className="text-[#3d5a45]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {drawEntries.slice(0, 5).map(entry => (
              <div key={entry.id} className="p-3 rounded-xl bg-[#172219] border border-[#1f3527]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm text-white font-medium">{entry.draw?.name || '—'}</div>
                    <div className="text-xs text-[#7aad8a]">{entry.draw?.draw_date ? format(new Date(entry.draw.draw_date), 'dd MMM yyyy') : '—'}</div>
                  </div>
                  <div className="text-right">
                    {entry.prize_amount > 0
                      ? <div className="text-sm font-bold text-[#4ade80]">£{entry.prize_amount.toFixed(2)}</div>
                      : null}
                    <div className={`text-xs font-semibold ${entry.match_count >= 5 ? 'text-[#d4af37]' : entry.match_count >= 3 ? 'text-[#4ade80]' : 'text-[#7aad8a]'}`}>
                      {entry.match_count || 0} match{entry.match_count !== 1 ? 'es' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {entry.entry_numbers?.map((n, i) => (
                    <span key={i} className="w-7 h-7 rounded-full bg-[#1f3527] text-[#4ade80] text-xs flex items-center justify-center font-bold">{n}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
