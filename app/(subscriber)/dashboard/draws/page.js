'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Trophy, CheckCircle, Clock, Info } from 'lucide-react';
import useDrawsStore from '@/store/drawsStore';

export default function DrawsPage() {
  const { draws, entries, isLoading, fetchDraws, fetchEntries } = useDrawsStore();

  useEffect(() => {
    fetchDraws();
    fetchEntries();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published': return <span className="badge-active text-xs px-2 py-0.5 rounded-full">Published</span>;
      case 'simulated': return <span className="badge-pending text-xs px-2 py-0.5 rounded-full">Simulated</span>;
      default: return <span className="text-xs px-2 py-0.5 rounded-full border border-[#1f3527] text-[#7aad8a]">Pending</span>;
    }
  };

  const getMyEntry = (drawId) => entries.find(e => e.draw_id === drawId);

  return (
    <div className="pt-4 md:pt-0">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Monthly Draws</h1>
        <p className="text-[#7aad8a] text-sm">Track your draw history and results</p>
      </div>

      <div className="mb-6 p-4 rounded-xl border border-[#1f3527] bg-[#172219] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#4ade80] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#7aad8a]">Your latest 5 Stableford scores become your draw numbers each month. Match 3, 4, or all 5 to win prizes.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl loading-skeleton" />)}</div>
      ) : draws.length === 0 ? (
        <div className="stat-card text-center py-16">
          <Trophy className="w-12 h-12 mx-auto text-[#2d5c3f] mb-4" />
          <h3 className="font-semibold text-white mb-2">No Draws Yet</h3>
          <p className="text-sm text-[#7aad8a]">Monthly draws will appear here once published by the admin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {draws.map((draw, i) => {
            const myEntry = getMyEntry(draw.id);
            return (
              <motion.div key={draw.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="stat-card">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-white text-lg">{draw.name}</h3>
                      {getStatusBadge(draw.status)}
                    </div>
                    <div className="text-sm text-[#7aad8a]">
                      {format(new Date(draw.draw_date), 'dd MMMM yyyy')} · {draw.draw_type === 'algorithmic' ? 'Algorithmic draw' : 'Random draw'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#7aad8a]">Prize Pool</div>
                    <div className="text-xl font-display font-bold text-[#d4af37]">£{(draw.prize_pool_total || 0).toFixed(2)}</div>
                  </div>
                </div>

                {/* Winning numbers */}
                {draw.winning_numbers?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-[#7aad8a] uppercase tracking-wider mb-2">Winning Numbers</div>
                    <div className="flex gap-2 flex-wrap">
                      {draw.winning_numbers.map((n, j) => (
                        <div key={j} className={`draw-ball w-10 h-10 text-base ${myEntry?.entry_numbers?.includes(n) ? 'border-[#d4af37] shadow-[0_0_16px_rgba(212,175,55,0.4)]' : ''}`}>
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* My entry */}
                {myEntry && (
                  <div className="p-3 rounded-xl bg-[#172219] border border-[#1f3527]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-[#7aad8a] mb-2">My Numbers</div>
                        <div className="flex gap-1.5 flex-wrap">
                          {myEntry.entry_numbers?.map((n, j) => (
                            <div key={j} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                              draw.winning_numbers?.includes(n)
                                ? 'bg-[#d4af37] border-[#d4af37] text-[#0a0f0d]'
                                : 'bg-[#1f3527] border-[#2d5c3f] text-[#7aad8a]'
                            }`}>
                              {n}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#7aad8a]">Matches: <span className={`font-bold ${myEntry.match_count >= 5 ? 'text-[#d4af37]' : myEntry.match_count >= 3 ? 'text-[#4ade80]' : 'text-white'}`}>{myEntry.match_count || 0}</span></div>
                        {myEntry.prize_amount > 0 && (
                          <div className="text-lg font-bold text-[#4ade80] mt-1">Won £{myEntry.prize_amount.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {draw.jackpot_rolled_over && (
                  <div className="mt-3 text-xs badge-gold px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Jackpot rolled over to next draw
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
