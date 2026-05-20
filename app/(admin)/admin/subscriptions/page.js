'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  CreditCard, Search, Users, XCircle, ChevronLeft, ChevronRight,
  Edit2, Check, X, Plus, Trash2, RefreshCw, CalendarDays,
  PoundSterling, AlertCircle,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  active:    'badge-active',
  inactive:  'badge-inactive',
  cancelled: 'badge-inactive',
  lapsed:    'badge-pending',
  past_due:  'badge-pending',
};
const STATUS_OPTS = ['active', 'inactive', 'cancelled', 'lapsed', 'past_due'];
const PLAN_OPTS   = ['monthly', 'yearly'];

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className = 'w-4 h-4' }) {
  return (
    <div className={`${className} border-2 border-current border-t-transparent rounded-full animate-spin inline-block`} />
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel = 'Confirm', confirmClass = 'btn-accent', onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="stat-card w-full max-w-sm">
        <h2 className="font-display text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-[#7aad8a] mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="btn-ghost flex-1 justify-center py-2.5 text-sm disabled:opacity-60">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`${confirmClass} flex-1 justify-center py-2.5 text-sm disabled:opacity-60 flex items-center gap-2`}>
            {loading ? <Spinner /> : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Plan + Amount Badge ──────────────────────────────────────────────────────
function PlanAmountBadge({ plan, amount }) {
  if (!plan) return <span className="badge-inactive text-xs px-2 py-0.5 rounded-full">None</span>;
  const display = amount
    ? `£${parseFloat(amount).toFixed(2)}`
    : plan === 'yearly' ? '£96.00/yr' : '£10.00/mo';
  return (
    <div>
      <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium inline-block mb-0.5"
        style={{
          background: plan === 'yearly' ? 'rgba(212,175,55,0.15)' : 'rgba(74,222,128,0.1)',
          color:      plan === 'yearly' ? '#d4af37' : '#4ade80',
          border:     `1px solid ${plan === 'yearly' ? 'rgba(212,175,55,0.3)' : 'rgba(74,222,128,0.3)'}`,
        }}>
        {plan}
      </span>
      <div className="text-xs text-[#7aad8a] mt-0.5">{display}</div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = '#4ade80' }) {
  return (
    <div className="stat-card flex items-start gap-4">
      <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[#7aad8a] text-xs mb-0.5">{label}</p>
        <p className="text-white font-bold text-xl leading-tight">{value}</p>
        {sub && <p className="text-[#7aad8a] text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Edit Subscription Modal ──────────────────────────────────────────────────
function EditModal({ sub, onClose, onSave }) {
  const [form, setForm] = useState({
    status:             sub.status,
    plan:               sub.plan || 'monthly',
    amount:             sub.amount || '',
    current_period_end: sub.current_period_end
      ? format(parseISO(sub.current_period_end), "yyyy-MM-dd'T'HH:mm")
      : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/subscriptions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: sub.id,
        ...form,
        current_period_end: form.current_period_end
          ? new Date(form.current_period_end).toISOString()
          : undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { toast.success('Subscription updated'); onSave(data.subscription); }
    else toast.error(data.error || 'Update failed');
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="stat-card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-white">Edit Subscription</h2>
          <button onClick={onClose} className="text-[#7aad8a] hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-3 rounded-xl bg-[#172219] border border-[#1f3527] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2d6a4f] to-[#4ade80] flex items-center justify-center text-[#0a0f0d] text-xs font-bold flex-shrink-0">
              {sub.users?.first_name?.[0] || '?'}
            </div>
            <div className="min-w-0">
              <div className="text-sm text-white font-medium">{sub.users?.first_name} {sub.users?.last_name}</div>
              <div className="text-xs text-[#7aad8a] truncate">{sub.users?.email}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#7aad8a] mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-dark text-sm">
              {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-[#111a14] capitalize">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#7aad8a] mb-1.5">Plan</label>
            <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} className="input-dark text-sm">
              {PLAN_OPTS.map(p => <option key={p} value={p} className="bg-[#111a14] capitalize">{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#7aad8a] mb-1.5">Amount (£)</label>
            <input type="number" step="0.01" min="0" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="input-dark text-sm" placeholder="e.g. 10.00" />
            <p className="text-xs text-[#5a8a6a] mt-1">Default: £10.00/mo · £96.00/yr</p>
          </div>
          <div>
            <label className="block text-xs text-[#7aad8a] mb-1.5">Period End</label>
            <input type="datetime-local" value={form.current_period_end}
              onChange={e => setForm({ ...form, current_period_end: e.target.value })}
              className="input-dark text-sm" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center py-2.5 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="btn-accent flex-1 justify-center py-2.5 text-sm disabled:opacity-60 flex items-center gap-2">
            {saving ? <Spinner /> : null} Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Grant Subscription Modal ─────────────────────────────────────────────────
function GrantModal({ onClose, onCreated }) {
  const [search, setSearch]       = useState('');
  const [users, setUsers]         = useState([]);
  const [picked, setPicked]       = useState(null);
  const [form, setForm]           = useState({ plan: 'monthly', amount: '', status: 'active', current_period_end: '' });
  const [saving, setSaving]       = useState(false);
  const [searching, setSearching] = useState(false);

  const searchUsers = useCallback(async (q) => {
    if (!q || q.length < 2) { setUsers([]); return; }
    setSearching(true);
    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=8`);
    const data = await res.json();
    setUsers(data.users || []);
    setSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(search), 300);
    return () => clearTimeout(t);
  }, [search, searchUsers]);

  const handleGrant = async () => {
    if (!picked) return toast.error('Select a user first');
    setSaving(true);
    const res = await fetch('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: picked.id, ...form,
        current_period_end: form.current_period_end ? new Date(form.current_period_end).toISOString() : undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { toast.success('Subscription granted'); onCreated(); }
    else toast.error(data.error || 'Failed to grant');
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="stat-card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-white">Grant Subscription</h2>
          <button onClick={onClose} className="text-[#7aad8a] hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* User search */}
        <div className="mb-4">
          <label className="block text-xs text-[#7aad8a] mb-1.5">Search User</label>
          <div className="relative">
            <input value={search} onChange={e => { setSearch(e.target.value); setPicked(null); }}
              className="input-dark pl-9 text-sm" placeholder="Name or email…" />
          </div>
          {(users.length > 0 || searching) && !picked && (
            <div className="mt-1 rounded-xl border border-[#1f3527] bg-[#111a14] overflow-hidden">
              {searching && <div className="px-4 py-3 text-xs text-[#7aad8a]">Searching…</div>}
              {users.map(u => (
                <button key={u.id} onClick={() => { setPicked(u); setUsers([]); setSearch(`${u.first_name} ${u.last_name}`); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#172219] text-left transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2d6a4f] to-[#4ade80] flex items-center justify-center text-[#0a0f0d] text-xs font-bold flex-shrink-0">
                    {u.first_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-white">{u.first_name} {u.last_name}</div>
                    <div className="text-xs text-[#7aad8a] truncate">{u.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {picked && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#172219] border border-[#2d5c3f]">
              <Check className="w-3.5 h-3.5 text-[#4ade80] flex-shrink-0" />
              <span className="text-sm text-white truncate">{picked.first_name} {picked.last_name}</span>
              <span className="text-xs text-[#7aad8a] truncate">({picked.email})</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#7aad8a] mb-1.5">Plan</label>
              <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} className="input-dark text-sm">
                <option value="monthly" className="bg-[#111a14]">Monthly — £10/mo</option>
                <option value="yearly"  className="bg-[#111a14]">Yearly — £96/yr</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#7aad8a] mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-dark text-sm">
                {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-[#111a14] capitalize">{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#7aad8a] mb-1.5">Amount (£)</label>
            <input type="number" step="0.01" min="0" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="input-dark text-sm" placeholder={form.plan === 'yearly' ? '96.00' : '10.00'} />
          </div>
          <div>
            <label className="block text-xs text-[#7aad8a] mb-1.5">Period End <span className="text-[#5a8a6a]">(optional)</span></label>
            <input type="datetime-local" value={form.current_period_end}
              onChange={e => setForm({ ...form, current_period_end: e.target.value })}
              className="input-dark text-sm" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center py-2.5 text-sm">Cancel</button>
          <button onClick={handleGrant} disabled={saving || !picked}
            className="btn-accent flex-1 justify-center py-2.5 text-sm disabled:opacity-60 flex items-center gap-2">
            {saving ? <Spinner /> : <Plus className="w-4 h-4" />} Grant Subscription
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSubscriptionsPage() {
  const [subs, setSubs]             = useState([]);
  const [stats, setStats]           = useState({});
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [loading, setLoading]       = useState(true);

  // Modal state
  const [editSub, setEditSub]           = useState(null);
  const [showGrant, setShowGrant]       = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [quickActionId, setQuickActionId] = useState(null);
  const [deletingId, setDeletingId]     = useState(null);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search)       params.append('search', search);
    if (statusFilter) params.append('status', statusFilter);
    if (planFilter)   params.append('plan', planFilter);
    const res  = await fetch(`/api/admin/subscriptions?${params}`);
    const data = await res.json();
    if (res.ok) {
      setSubs(data.subscriptions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setStats(data.stats || {});
    }
    setLoading(false);
  }, [page, search, statusFilter, planFilter]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const handleEditSave = (updated) => {
    setSubs(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
    setEditSub(null);
  };

  const handleQuickStatus = async (sub, newStatus) => {
    setQuickActionId(sub.id);
    const res  = await fetch('/api/admin/subscriptions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sub.id, status: newStatus }),
    });
    const data = await res.json();
    setQuickActionId(null);
    setConfirmCancel(null);
    if (res.ok) {
      toast.success(`Subscription ${newStatus}`);
      setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status: newStatus } : s));
    } else toast.error(data.error || 'Update failed');
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    const res = await fetch(`/api/admin/subscriptions?id=${id}`, { method: 'DELETE' });
    setDeletingId(null);
    setConfirmDelete(null);
    if (res.ok) { toast.success('Deleted'); setSubs(prev => prev.filter(s => s.id !== id)); }
    else toast.error('Delete failed');
  };

  const fmtDate = (d) => d ? format(parseISO(d), 'dd MMM yyyy') : '—';
  const fmtAmt  = (a, plan) => {
    if (a) return `£${parseFloat(a).toFixed(2)}`;
    return plan === 'yearly' ? '£96.00' : plan === 'monthly' ? '£10.00' : '—';
  };

  // ── Row action buttons (reused for desktop + mobile) ──────────────────────
  const RowActions = ({ sub }) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      {sub.status === 'active' ? (
        <button onClick={() => setConfirmCancel(sub)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#f87171] hover:bg-[#1f1a1a] border border-[#f8717130] transition-colors flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" /> Cancel
        </button>
      ) : (
        <button onClick={() => handleQuickStatus(sub, 'active')} disabled={quickActionId === sub.id}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#4ade80] hover:bg-[#172219] border border-[#4ade8030] transition-colors flex items-center gap-1 disabled:opacity-60">
          {quickActionId === sub.id ? <Spinner className="w-3 h-3" /> : <Check className="w-3.5 h-3.5" />}
          Activate
        </button>
      )}
      <button onClick={() => setEditSub(sub)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#7aad8a] hover:text-[#4ade80] hover:bg-[#172219] border border-[#1f3527] transition-colors flex items-center gap-1">
        <Edit2 className="w-3.5 h-3.5" /> Edit
      </button>
      <button onClick={() => setConfirmDelete(sub)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#7aad8a] hover:text-[#f87171] hover:bg-[#1f1a1a] border border-[#1f3527] transition-colors flex items-center gap-1">
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Subscriptions</h1>
          <p className="text-[#7aad8a] text-sm">{total} records</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchSubs} className="btn-ghost py-2 px-4 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => setShowGrant(true)} className="btn-accent py-2 px-4 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Grant Subscription
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}         label="Active"   value={stats.totalActive  ?? '—'} />
        <StatCard icon={CreditCard}    label="Monthly"  value={stats.totalMonthly ?? '—'} sub="£10/mo" color="#4ade80" />
        <StatCard icon={CalendarDays}  label="Yearly"   value={stats.totalYearly  ?? '—'} sub="£96/yr" color="#d4af37" />
        <StatCard icon={PoundSterling} label="Est. MRR" value={stats.mrr !== undefined ? `£${stats.mrr.toFixed(2)}` : '—'} color="#4ade80" />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <input type="text" placeholder="Search name or email…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-dark pl-10 text-sm w-full" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-dark text-sm w-full">
          <option value="" className="bg-[#111a14]">All statuses</option>
          {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-[#111a14] capitalize">{s}</option>)}
        </select>
        <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
          className="input-dark text-sm w-full">
          <option value="" className="bg-[#111a14]">All plans</option>
          {PLAN_OPTS.map(p => <option key={p} value={p} className="bg-[#111a14] capitalize">{p}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl loading-skeleton" />)}
        </div>
      ) : (
        <>
          {/* ── Desktop table (md and up) ─────────────────────────────────── */}
          <div className="stat-card overflow-x-auto hidden md:block">
            <table className="data-table min-w-[820px]">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan & Amount</th>
                  <th>Status</th>
                  <th>Period Start</th>
                  <th>Period End</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(sub => (
                  <motion.tr key={sub.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2d6a4f] to-[#4ade80] flex items-center justify-center text-[#0a0f0d] text-xs font-bold flex-shrink-0">
                          {sub.users?.first_name?.[0] || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm text-white font-medium">{sub.users?.first_name} {sub.users?.last_name}</div>
                          <div className="text-xs text-[#7aad8a] truncate">{sub.users?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><PlanAmountBadge plan={sub.plan} amount={sub.amount} /></td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[sub.status] || 'badge-inactive'}`}>
                        {sub.status}
                      </span>
                      {sub.current_period_end && new Date(sub.current_period_end) < new Date() && sub.status === 'active' && (
                        <div className="flex items-center gap-1 text-[10px] text-[#fbbf24] mt-0.5">
                          <AlertCircle className="w-3 h-3" /> Expired
                        </div>
                      )}
                    </td>
                    <td className="text-xs text-[#7aad8a]">{fmtDate(sub.current_period_start)}</td>
                    <td className="text-xs text-[#7aad8a]">{fmtDate(sub.current_period_end)}</td>
                    <td><RowActions sub={sub} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {subs.length === 0 && (
              <div className="text-center py-16 text-[#7aad8a]">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No subscriptions found</p>
              </div>
            )}
          </div>

          {/* ── Mobile cards (below md) ───────────────────────────────────── */}
          <div className="space-y-3 md:hidden">
            {subs.length === 0 && (
              <div className="stat-card text-center py-12 text-[#7aad8a]">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No subscriptions found</p>
              </div>
            )}
            {subs.map(sub => (
              <motion.div key={sub.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="stat-card">

                {/* User row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2d6a4f] to-[#4ade80] flex items-center justify-center text-[#0a0f0d] font-bold text-sm flex-shrink-0">
                    {sub.users?.first_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{sub.users?.first_name} {sub.users?.last_name}</div>
                    <div className="text-xs text-[#7aad8a] truncate">{sub.users?.email}</div>
                  </div>
                  {/* Status badge top-right */}
                  <div className="flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[sub.status] || 'badge-inactive'}`}>
                      {sub.status}
                    </span>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="p-2 rounded-lg bg-[#172219] col-span-2">
                    <div className="text-[#7aad8a] mb-1">Plan & Amount</div>
                    <PlanAmountBadge plan={sub.plan} amount={sub.amount} />
                  </div>
                  <div className="p-2 rounded-lg bg-[#172219]">
                    <div className="text-[#7aad8a] mb-1">Period Start</div>
                    <div className="text-white">{fmtDate(sub.current_period_start)}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#172219]">
                    <div className="text-[#7aad8a] mb-1">Period End</div>
                    <div className={`${sub.current_period_end && new Date(sub.current_period_end) < new Date() && sub.status === 'active' ? 'text-[#fbbf24]' : 'text-white'}`}>
                      {fmtDate(sub.current_period_end)}
                      {sub.current_period_end && new Date(sub.current_period_end) < new Date() && sub.status === 'active' && (
                        <span className="ml-1 text-[10px]">· Expired</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#1f3527]">
                  <RowActions sub={sub} />
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-ghost py-2 px-4 text-sm disabled:opacity-40 flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-[#7aad8a]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="btn-ghost py-2 px-4 text-sm disabled:opacity-40 flex items-center gap-2">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {editSub && <EditModal sub={editSub} onClose={() => setEditSub(null)} onSave={handleEditSave} />}
        {showGrant && (
          <GrantModal onClose={() => setShowGrant(false)} onCreated={() => { setShowGrant(false); fetchSubs(); }} />
        )}
        {confirmCancel && (
          <ConfirmModal
            title="Cancel Subscription"
            message={`Cancel the ${confirmCancel.plan} plan for ${confirmCancel.users?.first_name} ${confirmCancel.users?.last_name}? They will lose access at period end.`}
            confirmLabel="Yes, Cancel"
            confirmClass="bg-[#f87171] text-[#0a0f0d] hover:bg-[#ef4444] font-semibold rounded-xl px-4"
            loading={quickActionId === confirmCancel.id}
            onConfirm={() => handleQuickStatus(confirmCancel, 'cancelled')}
            onClose={() => setConfirmCancel(null)}
          />
        )}
        {confirmDelete && (
          <ConfirmModal
            title="Delete Record"
            message={`Permanently delete the subscription record for ${confirmDelete.users?.first_name} ${confirmDelete.users?.last_name}? This cannot be undone.`}
            confirmLabel="Delete Record"
            confirmClass="bg-[#f87171] text-[#0a0f0d] hover:bg-[#ef4444] font-semibold rounded-xl px-4"
            loading={deletingId === confirmDelete.id}
            onConfirm={() => handleDelete(confirmDelete.id)}
            onClose={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}