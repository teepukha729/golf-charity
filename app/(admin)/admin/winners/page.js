'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Award, CheckCircle, XCircle, Clock, DollarSign, Eye, Filter } from 'lucide-react';

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});

  const fetchWinners = async () => {
    setLoading(true);
    const res = await fetch('/api/winners?admin=true');
    const data = await res.json();
    if (res.ok) setWinners(data.winners || []);
    setLoading(false);
  };

  useEffect(() => { fetchWinners(); }, []);

  const handleUpdate = async (id, updates) => {
    setProcessing(id);
    const res = await fetch('/api/winners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, adminNotes: adminNotes[id], ...updates }),
    });
    const data = await res.json();
    setProcessing(null);
    if (res.ok) {
      toast.success('Winner updated!');
      setWinners(prev => prev.map(w => w.id === id ? { ...w, ...data.winner } : w));
    } else toast.error(data.error);
  };

  const tierColor = (type) => {
    if (type === '5-match') return '#d4af37';
    if (type === '4-match') return '#c0c0c0';
    return '#cd7f32';
  };

  const filtered = winners.filter(w => {
    if (filter === 'pending_verification') return w.verification_status === 'pending';
    if (filter === 'approved') return w.verification_status === 'approved';
    if (filter === 'pending_payment') return w.verification_status === 'approved' && w.payment_status === 'pending';
    if (filter === 'paid') return w.payment_status === 'paid';
    return true;
  });

  const pendingCount = winners.filter(w => w.verification_status === 'pending').length;
  const awaitingPayout = winners.filter(w => w.verification_status === 'approved' && w.payment_status === 'pending').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Winners Management</h1>
        <p className="text-[#7aad8a] text-sm">Verify proofs and process payouts</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Winners', value: winners.length, color: '#4ade80' },
          { label: 'Pending Verification', value: pendingCount, color: '#f59e0b' },
          { label: 'Awaiting Payout', value: awaitingPayout, color: '#f87171' },
          { label: 'Total Paid', value: `£${winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + (w.prize_amount || 0), 0).toFixed(2)}`, color: '#4ade80' },
        ].map((s, i) => (
          <div key={i} className="stat-card text-center">
            <div className="text-xl font-display font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-[#7aad8a]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending_verification', label: `Pending (${pendingCount})` },
          { key: 'approved', label: 'Approved' },
          { key: 'pending_payment', label: `Awaiting Payout (${awaitingPayout})` },
          { key: 'paid', label: 'Paid' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm border transition-all ${filter === f.key ? 'bg-[#2d6a4f] border-[#4ade80] text-white' : 'border-[#1f3527] text-[#7aad8a] hover:border-[#4ade80]'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-xl loading-skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="stat-card text-center py-16">
          <Award className="w-12 h-12 mx-auto text-[#2d5c3f] mb-4" />
          <p className="text-[#7aad8a]">No winners in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((winner, i) => (
            <motion.div key={winner.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="stat-card">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2d6a4f] to-[#4ade80] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {winner.user?.first_name?.[0]}{winner.user?.last_name?.[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{winner.user?.first_name} {winner.user?.last_name}</div>
                      <div className="text-xs text-[#7aad8a]">{winner.user?.email}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold capitalize"
                      style={{ color: tierColor(winner.match_type), background: `${tierColor(winner.match_type)}20`, border: `1px solid ${tierColor(winner.match_type)}40` }}>
                      {winner.match_type}
                    </span>
                  </div>
                  <div className="text-sm text-[#7aad8a]">
                    Draw: <span className="text-white">{winner.draw?.name}</span> · {winner.draw?.draw_date ? format(new Date(winner.draw.draw_date), 'dd MMM yyyy') : ''}
                  </div>
                  {winner.draw?.winning_numbers?.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {winner.draw.winning_numbers.map((n, j) => (
                        <span key={j} className="w-7 h-7 rounded-full bg-[#1f3527] text-[#4ade80] text-xs flex items-center justify-center font-bold">{n}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-bold text-[#4ade80]">£{(winner.prize_amount || 0).toFixed(2)}</div>
                  <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${winner.payment_status === 'paid' ? 'badge-active' : 'badge-pending'}`}>
                    {winner.payment_status === 'paid' ? '✓ Paid' : 'Payment Pending'}
                  </div>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${
                  winner.verification_status === 'approved' ? 'border-[#4ade80]/30 bg-[#0d1f12] text-[#4ade80]' :
                  winner.verification_status === 'rejected' ? 'border-[#f87171]/30 bg-[#1f0d0d] text-[#f87171]' :
                  'border-[#f59e0b]/30 bg-[#1a1500] text-[#f59e0b]'
                }`}>
                  {winner.verification_status === 'approved' ? <CheckCircle className="w-3 h-3" /> :
                   winner.verification_status === 'rejected' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  Verification: {winner.verification_status}
                </div>
                {winner.verified_at && <span className="text-xs text-[#5a8a6a]">Verified {format(new Date(winner.verified_at), 'dd MMM yyyy')}</span>}
              </div>

              {/* Proof */}
              {winner.proof_url ? (
                <div className="mb-4 p-3 rounded-xl bg-[#172219] border border-[#1f3527] flex items-center gap-3">
                  <Eye className="w-4 h-4 text-[#4ade80]" />
                  <span className="text-sm text-[#7aad8a]">Proof submitted</span>
                  <a href={winner.proof_url} target="_blank" rel="noopener noreferrer"
                    className="ml-auto text-xs text-[#4ade80] hover:underline flex items-center gap-1">
                    <Eye className="w-3 h-3" /> View Screenshot
                  </a>
                </div>
              ) : (
                <div className="mb-4 p-3 rounded-xl bg-[#172219] border border-[#1f3527] text-sm text-[#7aad8a]">
                  No proof uploaded yet
                </div>
              )}

              {/* Admin notes */}
              <div className="mb-4">
                <input value={adminNotes[winner.id] ?? (winner.admin_notes || '')}
                  onChange={e => setAdminNotes({ ...adminNotes, [winner.id]: e.target.value })}
                  className="input-dark text-xs py-2" placeholder="Admin notes (optional)..." />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-[#1f3527]">
                {winner.verification_status === 'pending' && (
                  <>
                    <button onClick={() => handleUpdate(winner.id, { verificationStatus: 'approved' })}
                      disabled={processing === winner.id}
                      className="btn-accent text-xs py-2 px-4 flex items-center gap-1.5">
                      {processing === winner.id ? <div className="w-3 h-3 border-2 border-[#0a0f0d] border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Approve
                    </button>
                    <button onClick={() => handleUpdate(winner.id, { verificationStatus: 'rejected' })}
                      disabled={processing === winner.id}
                      className="text-xs py-2 px-4 rounded-lg border border-[#f87171]/30 text-[#f87171] hover:bg-[#1f1212] transition-all flex items-center gap-1.5">
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </>
                )}
                {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                  <button onClick={() => handleUpdate(winner.id, { paymentStatus: 'paid' })}
                    disabled={processing === winner.id}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
                    {processing === winner.id ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <DollarSign className="w-3 h-3" />}
                    Mark as Paid
                  </button>
                )}
                {winner.payment_status === 'paid' && (
                  <div className="flex items-center gap-2 text-xs text-[#4ade80]">
                    <CheckCircle className="w-4 h-4" />
                    Paid {winner.paid_at ? format(new Date(winner.paid_at), 'dd MMM yyyy') : ''}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
