'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Heart, Check, Search, ExternalLink } from 'lucide-react';

export default function CharityPage() {
  const [charities, setCharities] = useState([]);
  const [selection, setSelection] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [percentage, setPercentage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/charities').then(r => r.json()),
      fetch('/api/charities/selection').then(r => r.json()),
    ]).then(([charData, selData]) => {
      setCharities(charData.charities || []);
      if (selData.selection) {
        setSelection(selData.selection);
        setSelected(selData.selection.charity_id);
        setPercentage(selData.selection.contribution_percentage);
      }
      setLoading(false);
    });
  }, []);

  const filtered = charities.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!selected) return toast.error('Please select a charity');
    setSaving(true);
    const res = await fetch('/api/charities/selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ charityId: selected, contributionPercentage: percentage }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setSelection(data.selection);
      toast.success('Charity selection saved!');
    } else toast.error(data.error);
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl loading-skeleton" />)}</div>;

  return (
    <div className="pt-4 md:pt-0">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">My Charity</h1>
        <p className="text-[#7aad8a] text-sm">Choose the charity that receives a portion of your subscription</p>
      </div>

      {/* Current selection */}
      {selection?.charity && (
        <div className="mb-6 p-5 rounded-xl border border-[#f87171]/30 bg-[#1a1216] flex items-center gap-4">
          <Heart className="w-8 h-8 text-[#f87171] flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-[#f87171] uppercase tracking-wider mb-1">Currently Supporting</div>
            <div className="font-semibold text-white">{selection.charity.name}</div>
            <div className="text-sm text-[#7aad8a]">{selection.contribution_percentage}% of your subscription ({selection.contribution_percentage >= 100 ? 'full amount' : `£${((selection.contribution_percentage / 100) * 10).toFixed(2)}/mo est.`})</div>
          </div>
        </div>
      )}

      {/* Contribution slider */}
      <div className="stat-card mb-6">
        <h3 className="font-semibold text-white mb-4">Contribution Percentage</h3>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <input type="range" min="10" max="100" step="5" value={percentage}
              onChange={e => setPercentage(parseInt(e.target.value))}
              className="w-full accent-[#4ade80]" />
            <div className="flex justify-between text-xs text-[#7aad8a] mt-1">
              <span>10% (min)</span><span>100%</span>
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-[#4ade80] w-20 text-center">{percentage}%</div>
        </div>
        <p className="text-xs text-[#7aad8a] mt-3">Estimated monthly charity contribution: <span className="text-[#4ade80] font-semibold">£{((percentage / 100) * 10).toFixed(2)}</span></p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7aad8a]" />
        <input type="text" placeholder="Search charities..." value={search} onChange={e => setSearch(e.target.value)} className="input-dark pl-10" />
      </div>

      {/* Charity grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {filtered.map((charity, i) => (
          <motion.div key={charity.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            onClick={() => setSelected(charity.id)}
            className={`stat-card cursor-pointer border-2 transition-all ${selected === charity.id ? 'border-[#f87171] bg-[#1a1216]' : 'border-[#1f3527] hover:border-[#2d5c3f]'}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#172219] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {charity.logo_url ? <img src={charity.logo_url} alt={charity.name} className="w-full h-full object-contain p-1" /> : <Heart className="w-6 h-6 text-[#f87171]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white truncate">{charity.name}</h3>
                  {selected === charity.id && <Check className="w-5 h-5 text-[#f87171] flex-shrink-0" />}
                </div>
                {charity.category && <span className="text-xs text-[#7aad8a]">{charity.category}</span>}
                <p className="text-xs text-[#5a8a6a] mt-1 line-clamp-2">{charity.description}</p>
              </div>
            </div>
            {charity.website && (
              <a href={charity.website} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="mt-3 flex items-center gap-1 text-xs text-[#7aad8a] hover:text-[#4ade80] transition-colors">
                <ExternalLink className="w-3 h-3" /> Visit Website
              </a>
            )}
          </motion.div>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving || !selected} className="btn-accent py-3 px-8 disabled:opacity-60">
        {saving ? <div className="w-4 h-4 border-2 border-[#0a0f0d] border-t-transparent rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> Save Selection</>}
      </button>
    </div>
  );
}
