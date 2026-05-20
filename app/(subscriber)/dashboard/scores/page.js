'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Target, Info, Check, X } from 'lucide-react';
import useScoresStore from '@/store/scoresStore';

export default function ScoresPage() {
  const { scores, isLoading, fetchScores, addScore, updateScore, deleteScore } = useScoresStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ score: '', date: new Date() });
  const [editForm, setEditForm] = useState({ score: '', date: new Date() });

  useEffect(() => { fetchScores(); }, []);

  const handleAdd = async () => {
    if (!form.score || form.score < 1 || form.score > 45) return toast.error('Score must be between 1 and 45');
    const result = await addScore(parseInt(form.score), format(form.date, 'yyyy-MM-dd'));
    if (result.success) {
      toast.success('Score added!');
      setForm({ score: '', date: new Date() });
      setShowAdd(false);
    } else toast.error(result.error);
  };

  const handleEdit = async (id) => {
    if (!editForm.score || editForm.score < 1 || editForm.score > 45) return toast.error('Score must be between 1 and 45');
    const result = await updateScore(id, parseInt(editForm.score), format(editForm.date, 'yyyy-MM-dd'));
    if (result.success) { toast.success('Score updated!'); setEditId(null); }
    else toast.error(result.error);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this score?')) return;
    const result = await deleteScore(id);
    if (result.success) toast.success('Score deleted');
    else toast.error(result.error);
  };

  const startEdit = (score) => {
    setEditId(score.id);
    setEditForm({ score: score.score, date: new Date(score.played_at) });
  };

  return (
    <div className="pt-4 md:pt-0">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">My Scores</h1>
          <p className="text-[#7aad8a] text-sm">Your latest 5 Stableford scores — these are your monthly draw numbers</p>
        </div>
        
          <button onClick={() => setShowAdd(!showAdd)} className="btn-accent text-sm py-2 px-5">
            <Plus className="w-4 h-4" /> Add Score
          </button>
     
      </div>

      {/* Info banner */}
      <div className="mb-6 p-4 rounded-xl border border-[#1f3527] bg-[#172219] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#4ade80] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#7aad8a]">
          <span className="text-white font-medium">How scores work: </span>
          Enter your last 5 Stableford scores (1 - 45). These become your numbers in the monthly draw. A new score automatically replaces the oldest when you have 5 scores.
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-6 stat-card border-[#4ade8040]">
            <h3 className="font-semibold text-white mb-4">Add New Score</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm text-[#7aad8a] mb-2">Stableford Score (1–45)</label>
                <input
                  type="number" min="1" max="45"
                  value={form.score}
                  onChange={e => setForm({ ...form, score: e.target.value })}
                  className="input-dark"
                  placeholder="e.g. 32"
                />
              </div>
              <div>
                <label className="block text-sm text-[#7aad8a] mb-2">Date Played</label>
                <DatePicker
                  selected={form.date}
                  onChange={date => setForm({ ...form, date })}
                  maxDate={new Date()}
                  className="input-dark w-full"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={isLoading} className="btn-accent flex-1 justify-center py-3 disabled:opacity-60">
                  {isLoading ? <div className="w-4 h-4 border-2 border-[#0a0f0d] border-t-transparent rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> Save</>}
                </button>
                <button onClick={() => setShowAdd(false)} className="btn-ghost py-3 px-4"><X className="w-4 h-4" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scores list */}
      {isLoading && scores.length === 0 ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl loading-skeleton" />)}</div>
      ) : scores.length === 0 ? (
        <div className="stat-card text-center py-16">
          <Target className="w-12 h-12 mx-auto text-[#2d5c3f] mb-4" />
          <h3 className="font-semibold text-white mb-2">No Scores Yet</h3>
          <p className="text-sm text-[#7aad8a] mb-6">Enter your first Stableford score to participate in monthly draws</p>
          <button onClick={() => setShowAdd(true)} className="btn-accent text-sm py-2 px-6"><Plus className="w-4 h-4" /> Add Your First Score</button>
        </div>
      ) : (
        <div className="space-y-3">
          {scores.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="stat-card">
              {editId === s.id ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-[#7aad8a] mb-2">Score</label>
                    <input type="number" min="1" max="45" value={editForm.score}
                      onChange={e => setEditForm({ ...editForm, score: e.target.value })} className="input-dark" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7aad8a] mb-2">Date</label>
                    <DatePicker selected={editForm.date} onChange={date => setEditForm({ ...editForm, date })}
                      maxDate={new Date()} className="input-dark w-full" dateFormat="dd/MM/yyyy" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(s.id)} className="btn-accent flex-1 py-2 text-sm justify-center"><Check className="w-4 h-4" /> Save</button>
                    <button onClick={() => setEditId(null)} className="btn-ghost py-2 px-3"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a472a] to-[#2d6a4f] flex items-center justify-center text-2xl font-display font-bold text-[#4ade80] border border-[#2d5c3f] flex-shrink-0">
                    {s.score}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white text-lg">Stableford Score: {s.score}</span>
                      {i === 0 && <span className="badge-active text-xs px-2 py-0.5 rounded-full">Most Recent</span>}
                      {i === scores.length - 1 && scores.length === 5 && (
                        <span className="text-xs text-[#5a8a6a] px-2 py-0.5 rounded-full border border-[#1f3527]">Oldest</span>
                      )}
                    </div>
                    <div className="text-sm text-[#7aad8a] mt-1">Played: {format(new Date(s.played_at), 'EEEE, dd MMMM yyyy')}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(s)} className="p-2 rounded-lg text-[#7aad8a] hover:text-[#4ade80] hover:bg-[#172219] transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg text-[#7aad8a] hover:text-[#f87171] hover:bg-[#1f1a1a] transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {/* Capacity indicator */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-[#1f3527] bg-[#0d1610]">
            <div className="flex gap-1.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < scores.length ? 'bg-[#4ade80]' : 'bg-[#1f3527]'}`} />
              ))}
            </div>
            <span className="text-sm text-[#7aad8a]">{scores.length}/5 scores entered</span>
            {scores.length < 5 && (
              <button onClick={() => setShowAdd(true)} className="ml-auto text-xs text-[#4ade80] hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
