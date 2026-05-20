'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Plus, Play, Send, Trophy, X, Shuffle, Brain, Info } from 'lucide-react';
import useDrawsStore from '@/store/drawsStore';

export default function AdminDrawsPage() {
  const { draws, isLoading, fetchDraws, createDraw, simulateDraw, publishDraw } = useDrawsStore();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', drawDate: new Date(), drawType: 'random' });
  const [simulating, setSimulating] = useState(null);
  const [publishing, setPublishing] = useState(null);
  const [simResult, setSimResult] = useState(null);

  useEffect(() => { fetchDraws(true); }, []);

  const handleCreate = async () => {
    if (!form.name) return toast.error('Draw name required');
    const result = await createDraw({ name: form.name, drawDate: format(form.drawDate, 'yyyy-MM-dd'), drawType: form.drawType });
    if (result.success) {
      toast.success('Draw created!');
      setShowCreate(false);
      setForm({ name: '', drawDate: new Date(), drawType: 'random' });
    } else toast.error(result.error);
  };

  const handleSimulate = async (id, drawType) => {
    setSimulating(id);
    const result = await simulateDraw(id, drawType);
    setSimulating(null);
    if (result.success) {
      setSimResult({ drawId: id, ...result });
      toast.success(`Simulated! Found ${result.result?.winners?.length || 0} winners`);
    } else toast.error(result.error);
  };

  const handlePublish = async (id) => {
    if (!confirm('Publish this draw? Winners will be notified by email.')) return;
    setPublishing(id);
    const result = await publishDraw(id);
    setPublishing(null);
    if (result.success) toast.success('Draw published! Winners notified.');
    else toast.error(result.error);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published': return <span className="badge-active text-xs px-2 py-0.5 rounded-full">Published</span>;
      case 'simulated': return <span className="badge-pending text-xs px-2 py-0.5 rounded-full">Simulated</span>;
      default: return <span className="text-xs px-2 py-0.5 rounded-full border border-[#1f3527] text-[#7aad8a]">Pending</span>;
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Draw Management</h1>
          <p className="text-[#7aad8a] text-sm">Create, simulate, and publish monthly draws</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-accent text-sm py-2 px-5">
          <Plus className="w-4 h-4" /> New Draw
        </button>
      </div>

      {/* Draw lifecycle info */}
      <div className="mb-6 p-4 rounded-xl border border-[#1f3527] bg-[#172219] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#4ade80] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#7aad8a]">
          <span className="text-white font-medium">Draw lifecycle: </span>
          Create draw → Simulate (generates numbers & calculates winners) → Publish (notifies winners via email). Simulate multiple times before publishing.
        </p>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-6 stat-card border-[#d4af3740]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Create New Draw</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#7aad8a] hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#7aad8a] mb-2">Draw Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-dark" placeholder="e.g. January 2026 Draw" />
              </div>
              <div>
                <label className="block text-sm text-[#7aad8a] mb-2">Draw Date</label>
                <DatePicker selected={form.drawDate} onChange={date => setForm({ ...form, drawDate: date })}
                  className="input-dark w-full" dateFormat="dd/MM/yyyy" />
              </div>
              <div>
                <label className="block text-sm text-[#7aad8a] mb-2">Default Draw Type</label>
                <select value={form.drawType} onChange={e => setForm({ ...form, drawType: e.target.value })} className="input-dark">
                  <option value="random">Random</option>
                  <option value="algorithmic">Algorithmic (Weighted)</option>
                </select>
              </div>
            </div>
            <button onClick={handleCreate} className="btn-accent mt-4 text-sm py-2 px-6">Create Draw</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sim result */}
      {simResult && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-5 rounded-xl border border-[#4ade8040] bg-[#111a14]">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-[#4ade80] mb-2">Simulation Complete</h3>
              <div className="flex gap-2 mb-3">
                {simResult.winningNumbers?.map((n, i) => (
                  <div key={i} className="draw-ball w-10 h-10 text-sm">{n}</div>
                ))}
              </div>
              <div className="text-sm text-[#7aad8a]">
                {simResult.result?.entries || 0} entries · {simResult.result?.winners?.length || 0} winners ·
                Jackpot {simResult.result?.jackpotRolledOver ? 'rolled over' : 'won'}
              </div>
            </div>
            <button onClick={() => setSimResult(null)} className="text-[#7aad8a] hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </motion.div>
      )}

      {/* Draws list */}
      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl loading-skeleton" />)}</div>
      ) : draws.length === 0 ? (
        <div className="stat-card text-center py-16">
          <Trophy className="w-12 h-12 mx-auto text-[#2d5c3f] mb-4" />
          <p className="text-[#7aad8a]">No draws yet. Create your first draw!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {draws.map((draw, i) => (
            <motion.div key={draw.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="stat-card">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white text-lg">{draw.name}</h3>
                    {getStatusBadge(draw.status)}
                    <span className="text-xs text-[#7aad8a]">{draw.draw_type}</span>
                  </div>
                  <div className="text-sm text-[#7aad8a]">{format(new Date(draw.draw_date), 'dd MMMM yyyy')}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#7aad8a]">Prize Pool</div>
                  <div className="text-xl font-display font-bold text-[#d4af37]">£{(draw.prize_pool_total || 0).toFixed(2)}</div>
                </div>
              </div>

              {/* Pool breakdown */}
              <div className="grid grid-cols-3 gap-3 mb-4 text-center text-xs">
                <div className="p-2 rounded-lg bg-[#172219]">
                  <div className="text-[#d4af37] font-bold">£{(draw.jackpot_amount || 0).toFixed(2)}</div>
                  <div className="text-[#7aad8a]">Jackpot (40%)</div>
                  {draw.rollover_amount > 0 && <div className="text-[#d4af37] text-xs">+£{draw.rollover_amount.toFixed(2)} rollover</div>}
                </div>
                <div className="p-2 rounded-lg bg-[#172219]">
                  <div className="text-[#c0c0c0] font-bold">£{(draw.four_match_amount || 0).toFixed(2)}</div>
                  <div className="text-[#7aad8a]">4-Match (35%)</div>
                </div>
                <div className="p-2 rounded-lg bg-[#172219]">
                  <div className="text-[#cd7f32] font-bold">£{(draw.three_match_amount || 0).toFixed(2)}</div>
                  <div className="text-[#7aad8a]">3-Match (25%)</div>
                </div>
              </div>

              {/* Winning numbers */}
              {draw.winning_numbers?.length > 0 && (
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-xs text-[#7aad8a]">Numbers:</span>
                  <div className="flex gap-2">
                    {draw.winning_numbers.map((n, j) => <div key={j} className="draw-ball w-9 h-9 text-sm">{n}</div>)}
                  </div>
                  <span className="text-xs text-[#7aad8a]">· {draw.participant_count || 0} participants</span>
                </div>
              )}

              {/* Actions */}
              {draw.status !== 'published' && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-[#1f3527]">
                  <button onClick={() => handleSimulate(draw.id, 'random')} disabled={simulating === draw.id}
                    className="btn-ghost text-xs py-2 px-4 flex items-center gap-2">
                    {simulating === draw.id ? <div className="w-3 h-3 border border-[#7aad8a] border-t-transparent rounded-full animate-spin" /> : <Shuffle className="w-3 h-3" />}
                    Simulate (Random)
                  </button>
                  <button onClick={() => handleSimulate(draw.id, 'algorithmic')} disabled={simulating === draw.id}
                    className="btn-ghost text-xs py-2 px-4 flex items-center gap-2">
                    <Brain className="w-3 h-3" /> Simulate (Algorithmic)
                  </button>
                  {draw.status === 'simulated' && (
                    <button onClick={() => handlePublish(draw.id)} disabled={publishing === draw.id}
                      className="btn-accent text-xs py-2 px-4 flex items-center gap-2 ml-auto">
                      {publishing === draw.id ? <div className="w-3 h-3 border-2 border-[#0a0f0d] border-t-transparent rounded-full animate-spin" /> : <Send className="w-3 h-3" />}
                      Publish & Notify Winners
                    </button>
                  )}
                </div>
              )}

              {draw.status === 'published' && (
                <div className="pt-3 border-t border-[#1f3527] text-xs text-[#5a8a6a]">
                  Published {draw.published_at ? format(new Date(draw.published_at), 'dd MMM yyyy HH:mm') : ''}
                  {draw.jackpot_rolled_over && <span className="ml-3 text-[#d4af37]">· Jackpot rolled over</span>}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
