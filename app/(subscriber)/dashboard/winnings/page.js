'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { Gift, Upload, CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';

function ProofUpload({ winner, onUploaded }) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        const res = await fetch('/api/upload/proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ winnerId: winner.id, imageData: base64 }),
        });
        const data = await res.json();
        setUploading(false);
        if (res.ok) { toast.success('Proof uploaded!'); onUploaded(); }
        else toast.error(data.error);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error('Upload failed');
    }
  }, [winner.id, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  });

  return (
    <div {...getRootProps()} className={`mt-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${isDragActive ? 'border-[#4ade80] bg-[#172219]' : 'border-[#2d5c3f] hover:border-[#4ade80]'}`}>
      <input {...getInputProps()} />
      <div className="text-center">
        {uploading ? (
          <div className="w-6 h-6 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin mx-auto" />
        ) : (
          <>
            <Upload className="w-6 h-6 text-[#7aad8a] mx-auto mb-2" />
            <p className="text-sm text-[#7aad8a]">{isDragActive ? 'Drop here' : 'Drop screenshot or click to upload'}</p>
            <p className="text-xs text-[#5a8a6a] mt-1">Upload proof of your golf scores</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function WinningsPage() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWinners = async () => {
    const res = await fetch('/api/winners');
    const data = await res.json();
    if (res.ok) setWinners(data.winners || []);
    setLoading(false);
  };

  useEffect(() => { fetchWinners(); }, []);

  const totalWon = winners.reduce((s, w) => s + (w.prize_amount || 0), 0);
  const totalPaid = winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + (w.prize_amount || 0), 0);

  const getVerificationIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-[#4ade80]" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-[#f87171]" />;
      default: return <Clock className="w-4 h-4 text-[#f59e0b]" />;
    }
  };

  const tierColor = (type) => {
    if (type === '5-match') return '#d4af37';
    if (type === '4-match') return '#c0c0c0';
    return '#cd7f32';
  };

  return (
    <div className="pt-4 md:pt-0">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">My Winnings</h1>
        <p className="text-[#7aad8a] text-sm">Track your prize wins and payment status</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card text-center">
          <div className="text-2xl font-display font-bold text-[#d4af37] mb-1">£{totalWon.toFixed(2)}</div>
          <div className="text-xs text-[#7aad8a]">Total Won</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-display font-bold text-[#4ade80] mb-1">£{totalPaid.toFixed(2)}</div>
          <div className="text-xs text-[#7aad8a]">Total Paid</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-display font-bold text-white mb-1">{winners.length}</div>
          <div className="text-xs text-[#7aad8a]">Total Prizes</div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-40 rounded-xl loading-skeleton" />)}</div>
      ) : winners.length === 0 ? (
        <div className="stat-card text-center py-16">
          <Gift className="w-12 h-12 mx-auto text-[#2d5c3f] mb-4" />
          <h3 className="font-semibold text-white mb-2">No Winnings Yet</h3>
          <p className="text-sm text-[#7aad8a]">Keep entering scores and participating in draws to win prizes!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {winners.map((winner, i) => (
            <motion.div key={winner.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="stat-card">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Trophy className="w-5 h-5" style={{ color: tierColor(winner.match_type) }} />
                    <span className="font-semibold text-white capitalize">{winner.match_type} Win</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ color: tierColor(winner.match_type), background: `${tierColor(winner.match_type)}20`, border: `1px solid ${tierColor(winner.match_type)}40` }}>
                      {winner.match_type === '5-match' ? '🥇 Jackpot' : winner.match_type === '4-match' ? '🥈 Silver' : '🥉 Bronze'}
                    </span>
                  </div>
                  <div className="text-sm text-[#7aad8a]">
                    Draw: {winner.draw?.name} · {winner.draw?.draw_date ? format(new Date(winner.draw.draw_date), 'dd MMM yyyy') : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-bold text-[#4ade80]">£{winner.prize_amount?.toFixed(2)}</div>
                  <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${winner.payment_status === 'paid' ? 'badge-active' : 'badge-pending'}`}>
                    {winner.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
                  </div>
                </div>
              </div>

              {/* Verification status */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#172219] border border-[#1f3527]">
                {getVerificationIcon(winner.verification_status)}
                <span className="text-sm text-white capitalize">Verification: {winner.verification_status}</span>
                {winner.admin_notes && (
                  <span className="text-xs text-[#7aad8a] ml-2">— {winner.admin_notes}</span>
                )}
              </div>

              {/* Proof upload if pending */}
              {winner.verification_status === 'pending' && !winner.proof_url && (
                <ProofUpload winner={winner} onUploaded={fetchWinners} />
              )}

              {winner.proof_url && (
                <div className="mt-3 p-3 rounded-xl bg-[#172219] border border-[#1f3527] flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[#4ade80]" />
                  <span className="text-sm text-[#7aad8a]">Proof submitted</span>
                  <a href={winner.proof_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-[#4ade80] hover:underline">View</a>
                </div>
              )}

              {winner.paid_at && (
                <div className="mt-2 text-xs text-[#5a8a6a]">Paid on {format(new Date(winner.paid_at), 'dd MMM yyyy')}</div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
