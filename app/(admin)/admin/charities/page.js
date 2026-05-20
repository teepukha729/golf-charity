'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Heart, Check, Star, Users } from 'lucide-react';
import Modal, { ConfirmModal } from '@/components/ui/Modal';

const emptyForm = { name: '', description: '', category: '', website: '', logo_url: '', banner_url: '', isFeatured: false };

function CharityForm({ form, setForm }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Name *</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" placeholder="Charity name" />
        </div>
        <div>
          <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Category</label>
          <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-dark" placeholder="e.g. Health, Children" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Description</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          className="input-dark h-24 resize-none" placeholder="About this charity..." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Website URL</label>
          <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="input-dark" placeholder="https://" />
        </div>
        <div>
          <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Logo URL</label>
          <input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} className="input-dark" placeholder="https://" />
        </div>
        <div>
          <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Banner URL</label>
          <input value={form.banner_url} onChange={e => setForm({ ...form, banner_url: e.target.value })} className="input-dark" placeholder="https://" />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })}
            className="w-4 h-4 accent-[#d4af37]" />
          <label htmlFor="featured" className="text-sm text-[#7aad8a] cursor-pointer">Feature on homepage</label>
        </div>
      </div>
    </div>
  );
}

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCharities = async () => {
    const res = await fetch('/api/charities?admin=true');
    const data = await res.json();
    setCharities(data.charities || []);
    setLoading(false);
  };

  useEffect(() => { fetchCharities(); }, []);

  const handleSave = async () => {
    if (!form.name) return toast.error('Charity name required');
    setSaving(true);
    const isEdit = !!editId;
    const res = await fetch('/api/charities', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? { id: editId, ...form } : form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      toast.success(`Charity ${isEdit ? 'updated' : 'created'}!`);
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      fetchCharities();
    } else toast.error(data.error);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/charities?id=${deleteTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) { toast.success('Charity deactivated'); setDeleteTarget(null); fetchCharities(); }
    else toast.error('Failed to deactivate');
  };

  const handleToggleFeatured = async (charity) => {
    const res = await fetch('/api/charities', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: charity.id, isFeatured: !charity.is_featured }),
    });
    if (res.ok) { toast.success('Updated'); fetchCharities(); }
  };

  const openEdit = (charity) => {
    setEditId(charity.id);
    setForm({ name: charity.name, description: charity.description || '', category: charity.category || '', website: charity.website || '', logo_url: charity.logo_url || '', banner_url: charity.banner_url || '', isFeatured: charity.is_featured });
    setShowForm(true);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-1">Charities</h1>
          <p className="text-[#7aad8a] text-sm">Manage charity listings on the platform</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }} className="btn-accent text-sm py-2 px-5 flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Charity
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-40 rounded-xl loading-skeleton" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {charities.map((charity, i) => (
            <motion.div key={charity.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="stat-card">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#172219] border border-[#1f3527] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {charity.logo_url
                    ? <img src={charity.logo_url} alt={charity.name} className="w-full h-full object-contain p-1.5 rounded-xl" />
                    : <Heart className="w-5 h-5 text-[#f87171]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <h3 className="font-semibold text-white text-sm">{charity.name}</h3>
                    {charity.is_featured && <span className="badge-gold text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1"><Star className="w-2.5 h-2.5" />Featured</span>}
                    {!charity.is_active && <span className="badge-inactive text-[10px] px-1.5 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  {charity.category && <div className="text-[11px] text-[#7aad8a] uppercase tracking-wider mb-1">{charity.category}</div>}
                  <p className="text-xs text-[#5a8a6a] line-clamp-2 leading-relaxed">{charity.description}</p>
                </div>
              </div>

              {/* Stats row */}
              {(charity.total_raised > 0 || charity.subscriber_count > 0) && (
                <div className="mt-3 flex gap-3">
                  {charity.total_raised > 0 && (
                    <div className="flex items-center gap-1 text-xs text-[#7aad8a]">
                      <Heart className="w-3 h-3 text-[#f87171]" />
                      {formatCurrency(charity.total_raised, 0)} raised
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#1f3527]">
                <button onClick={() => handleToggleFeatured(charity)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                    charity.is_featured ? 'border-[#d4af37]/40 text-[#d4af37] bg-[#d4af37]/5' : 'border-[#1f3527] text-[#7aad8a] hover:border-[#d4af37]/40'
                  }`}>
                  <Star className="w-3 h-3" />{charity.is_featured ? 'Unfeature' : 'Feature'}
                </button>
                <button onClick={() => openEdit(charity)} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => setDeleteTarget(charity)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#1f3527] text-[#f87171] hover:bg-[#1f1a1a] hover:border-[#f87171]/30 transition-all flex items-center gap-1 ml-auto">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? 'Edit Charity' : 'Add New Charity'} size="lg">
        <CharityForm form={form} setForm={setForm} />
        <div className="flex gap-3 mt-6">
          <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn-ghost flex-1 justify-center py-2.5 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-accent flex-1 justify-center py-2.5 text-sm disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-[#0a0f0d] border-t-transparent rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> {editId ? 'Save Changes' : 'Create Charity'}</>}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Charity"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"? It will be hidden from the platform but data will be preserved.`}
        confirmLabel="Deactivate"
        danger
        loading={deleting}
      />
    </div>
  );
}
