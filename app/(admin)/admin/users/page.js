'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import { Search, Users, ChevronLeft, ChevronRight, Target, Plus, Trash2, X } from 'lucide-react';

// ─── Spinner helper ────────────────────────────────────────────────────────────
function Spinner({ className = 'w-4 h-4' }) {
  return (
    <div className={`${className} border-2 border-current border-t-transparent rounded-full animate-spin`} />
  );
}

// ─── Confirmation Modal ────────────────────────────────────────────────────────
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

// ─── Golf Scores Panel (admin editable) ──────────────────────────────────────
function AdminScoresPanel({ user, onClose }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({ score: '', date: new Date() });
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ score: '', date: new Date() });
  const [savingAdd, setSavingAdd] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchScores = async () => {
    setLoading(true);
    const res = await fetch(`/api/scores?userId=${user.id}`);
    const data = await res.json();
    if (res.ok) setScores(data.scores || []);
    setLoading(false);
  };

  useEffect(() => { fetchScores(); }, []);

  const handleAdd = async () => {
    if (!addForm.score || addForm.score < 1 || addForm.score > 45)
      return toast.error('Score must be between 1 and 45');
    setSavingAdd(true);
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: parseInt(addForm.score),
        playedAt: format(addForm.date, 'yyyy-MM-dd'),
        userId: user.id,
      }),
    });
    const data = await res.json();
    setSavingAdd(false);
    if (res.ok) {
      toast.success('Score added');
      setScores(data.scores || []);
      setAddForm({ score: '', date: new Date() });
      setShowAdd(false);
    } else toast.error(data.error || 'Failed to add score');
  };

  const handleEdit = async (id) => {
    if (!editForm.score || editForm.score < 1 || editForm.score > 45)
      return toast.error('Score must be between 1 and 45');
    setSavingEdit(true);
    const res = await fetch('/api/scores', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        score: parseInt(editForm.score),
        playedAt: format(editForm.date, 'yyyy-MM-dd'),
      }),
    });
    const data = await res.json();
    setSavingEdit(false);
    if (res.ok) {
      toast.success('Score updated');
      setScores(prev => prev.map(s => s.id === id ? { ...s, ...data.score } : s));
      setEditId(null);
    } else toast.error(data.error || 'Failed to update score');
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    const res = await fetch(`/api/scores?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Score deleted');
      setScores(prev => prev.filter(s => s.id !== id));
    } else toast.error('Failed to delete score');
    setDeletingId(null);
    setConfirmDelete(null);
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="stat-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-[#4ade80]" /> Golf Scores
            </h2>
            <p className="text-xs text-[#7aad8a] mt-1">
              {user.first_name} {user.last_name} · {scores.length}/5 scores
            </p>
          </div>
          <button onClick={onClose} className="text-[#7aad8a] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Score Button */}
        {scores.length < 5 && !showAdd && (
          <button onClick={() => setShowAdd(true)}
            className="btn-accent w-full justify-center py-2.5 text-sm mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Score
          </button>
        )}

        {/* Add Score Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="mb-4 p-4 rounded-xl border border-[#4ade8040] bg-[#172219]">
              <h3 className="text-sm font-semibold text-white mb-3">Add New Score</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-[#7aad8a] mb-1.5">Stableford Score (1–45)</label>
                  <input type="number" min="1" max="45" value={addForm.score}
                    onChange={e => setAddForm({ ...addForm, score: e.target.value })}
                    className="input-dark text-sm" placeholder="e.g. 32" />
                </div>
                <div>
                  <label className="block text-xs text-[#7aad8a] mb-1.5">Date Played</label>
                  <DatePicker selected={addForm.date}
                    onChange={date => setAddForm({ ...addForm, date })}
                    maxDate={new Date()} className="input-dark text-sm w-full" dateFormat="dd/MM/yyyy" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={savingAdd}
                  className="btn-accent flex-1 justify-center py-2.5 text-sm disabled:opacity-60 flex items-center gap-2">
                  {savingAdd ? <Spinner /> : null} Save Score
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="btn-ghost py-2.5 px-4 text-sm">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scores List */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl loading-skeleton" />)}
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-10 text-[#7aad8a]">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No scores entered yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scores.map((s, i) => (
              <div key={s.id} className="p-3 rounded-xl bg-[#172219] border border-[#1f3527]">
                {editId === s.id ? (
                  <div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-[#7aad8a] mb-1">Score</label>
                        <input type="number" min="1" max="45" value={editForm.score}
                          onChange={e => setEditForm({ ...editForm, score: e.target.value })}
                          className="input-dark text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#7aad8a] mb-1">Date</label>
                        <DatePicker selected={editForm.date}
                          onChange={date => setEditForm({ ...editForm, date })}
                          maxDate={new Date()} className="input-dark text-sm w-full" dateFormat="dd/MM/yyyy" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(s.id)} disabled={savingEdit}
                        className="btn-accent flex-1 justify-center py-2 text-sm disabled:opacity-60 flex items-center gap-2">
                        {savingEdit ? <Spinner /> : null} Save Changes
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="btn-ghost py-2 px-4 text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a472a] to-[#2d6a4f] flex items-center justify-center text-xl font-display font-bold text-[#4ade80] border border-[#2d5c3f] flex-shrink-0">
                      {s.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">Score: {s.score}</span>
                        {i === 0 && <span className="badge-active text-xs px-2 py-0.5 rounded-full">Latest</span>}
                      </div>
                      <div className="text-xs text-[#7aad8a] mt-0.5">
                        {format(new Date(s.played_at), 'dd MMM yyyy')}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditId(s.id); setEditForm({ score: s.score, date: new Date(s.played_at) }); }}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#7aad8a] hover:text-[#4ade80] hover:bg-[#1a3022] transition-all border border-[#1f3527]">
                        Edit
                      </button>
                      <button onClick={() => setConfirmDelete(s.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#7aad8a] hover:text-[#f87171] hover:bg-[#1f1a1a] transition-all border border-[#1f3527]">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Capacity dots */}
            <div className="flex items-center gap-2 pt-1 px-1">
              <div className="flex gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < scores.length ? 'bg-[#4ade80]' : 'bg-[#1f3527]'}`} />
                ))}
              </div>
              <span className="text-xs text-[#7aad8a]">{scores.length}/5 slots used</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmModal
            title="Delete Score"
            message="Are you sure you want to permanently delete this score? This cannot be undone."
            confirmLabel="Delete Score"
            confirmClass="bg-[#f87171] text-[#0a0f0d] hover:bg-[#ef4444] font-semibold rounded-xl px-4 py-2.5"
            loading={deletingId === confirmDelete}
            onConfirm={() => handleDelete(confirmDelete)}
            onClose={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Subscription Badge with amount ──────────────────────────────────────────
function SubscriptionBadge({ sub }) {
  if (!sub) return <span className="badge-inactive text-xs px-2 py-0.5 rounded-full">None</span>;

  const amount = sub.amount ? `£${parseFloat(sub.amount).toFixed(2)}` : (sub.plan === 'yearly' ? '£96/yr' : '£10/mo');

  return (
    <div>
      <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium inline-block mb-0.5
        ${sub.plan === 'yearly'
          ? 'bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]'
          : 'badge-active'}`}>
        {sub.plan}
      </span>
      <div className="text-xs text-[#7aad8a]">{amount}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [scoresUser, setScoresUser] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.append('search', search);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    if (res.ok) {
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const handleEdit = async (id) => {
    setSavingEdit(true);
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editData }),
    });
    const data = await res.json();
    setSavingEdit(false);
    if (res.ok) {
      toast.success('User updated');
      setEditId(null);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data.user } : u));
    } else toast.error(data.error);
  };

  const toggleActive = async (user) => {
    setTogglingId(user.id);
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, isActive: !user.is_active }),
    });
    setTogglingId(null);
    setConfirmToggle(null);
    if (res.ok) {
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Users</h1>
          <p className="text-[#7aad8a] text-sm">{total} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <input type="text" placeholder="Search by name or email..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-dark pl-10" />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl loading-skeleton" />)}</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="stat-card overflow-x-auto hidden md:block">
            <table className="data-table min-w-[820px]">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Subscription & Plan</th>
                  <th>Scores</th>
                  <th>Charity</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    {/* User name/email */}
                    <td>
                      {editId === user.id ? (
                        <div className="flex gap-2">
                          <input value={editData.firstName ?? user.first_name}
                            onChange={e => setEditData({ ...editData, firstName: e.target.value })}
                            className="input-dark py-1 text-xs w-24" placeholder="First" />
                          <input value={editData.lastName ?? user.last_name}
                            onChange={e => setEditData({ ...editData, lastName: e.target.value })}
                            className="input-dark py-1 text-xs w-24" placeholder="Last" />
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-white font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-[#7aad8a]">{user.email}</div>
                        </div>
                      )}
                    </td>

                    {/* ── Subscription with amount ── */}
                    <td>
                      <SubscriptionBadge sub={user.activeSubscription} />
                    </td>

                    {/* Scores — clickable to open admin panel */}
                    <td>
                      <button onClick={() => setScoresUser(user)}
                        className="flex items-center gap-1.5 group">
                        <span className="text-[#4ade80] font-semibold">{user.scoreCount}</span>
                        <span className="text-[#7aad8a]">/5</span>
                        <span className="text-[10px] text-[#4ade80] opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          Edit
                        </span>
                      </button>
                    </td>

                    <td className="text-xs text-[#7aad8a]">
                      {user.user_charities?.[0]?.charities?.name || '—'}
                    </td>

                    {/* Status toggle — with confirm */}
                    <td>
                      <button onClick={() => setConfirmToggle(user)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${user.is_active ? 'badge-active hover:opacity-80' : 'badge-inactive hover:opacity-80'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="text-xs text-[#7aad8a]">{format(new Date(user.created_at), 'dd MMM yy')}</td>

                    {/* Actions */}
                    <td>
                      <div className="flex gap-2 items-center">
                        {editId === user.id ? (
                          <>
                            <button onClick={() => handleEdit(user.id)} disabled={savingEdit}
                              className="btn-accent py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-60">
                              {savingEdit ? <Spinner className="w-3 h-3" /> : null} Save
                            </button>
                            <button onClick={() => setEditId(null)}
                              className="btn-ghost py-1.5 px-3 text-xs">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditId(user.id); setEditData({}); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#7aad8a] hover:text-[#4ade80] hover:bg-[#172219] border border-[#1f3527] transition-all">
                              Edit
                            </button>
                            <button onClick={() => setScoresUser(user)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#7aad8a] hover:text-[#4ade80] hover:bg-[#172219] border border-[#1f3527] transition-all flex items-center gap-1">
                              <Target className="w-3 h-3" /> Scores
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-12 text-[#7aad8a]">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No users found
              </div>
            )}
          </div>

          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {users.length === 0 && (
              <div className="text-center py-12 text-[#7aad8a] stat-card">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No users found
              </div>
            )}
            {users.map(user => (
              <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="stat-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2d6a4f] to-[#4ade80] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                    <div>
                      {editId === user.id ? (
                        <div className="flex flex-col gap-1">
                          <input value={editData.firstName ?? user.first_name}
                            onChange={e => setEditData({ ...editData, firstName: e.target.value })}
                            className="input-dark py-1 text-xs w-28" placeholder="First name" />
                          <input value={editData.lastName ?? user.last_name}
                            onChange={e => setEditData({ ...editData, lastName: e.target.value })}
                            className="input-dark py-1 text-xs w-28" placeholder="Last name" />
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-semibold text-white">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-[#7aad8a] break-all">{user.email}</div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Mobile actions */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {editId === user.id ? (
                      <>
                        <button onClick={() => handleEdit(user.id)} disabled={savingEdit}
                          className="btn-accent py-1.5 px-3 text-xs flex items-center gap-1 disabled:opacity-60">
                          {savingEdit ? <Spinner className="w-3 h-3" /> : null} Save
                        </button>
                        <button onClick={() => setEditId(null)} className="btn-ghost py-1.5 px-3 text-xs">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => { setEditId(user.id); setEditData({}); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#7aad8a] hover:text-[#4ade80] border border-[#1f3527]">
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Subscription with amount */}
                  <div className="p-2 rounded-lg bg-[#172219] col-span-2">
                    <div className="text-[#7aad8a] mb-1">Subscription</div>
                    {user.activeSubscription ? (
                      <div className="flex items-center justify-between">
                        <SubscriptionBadge sub={user.activeSubscription} />
                      </div>
                    ) : <span className="badge-inactive px-2 py-0.5 rounded-full">None</span>}
                  </div>

                  {/* Scores — tappable */}
                  <div className="p-2 rounded-lg bg-[#172219]">
                    <div className="text-[#7aad8a] mb-1">Scores</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#4ade80] font-semibold">{user.scoreCount}</span>/5
                      <button onClick={() => setScoresUser(user)}
                        className="text-[10px] text-[#4ade80] border border-[#4ade8040] px-1.5 py-0.5 rounded ml-1">
                        Manage
                      </button>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#172219]">
                    <div className="text-[#7aad8a] mb-1">Charity</div>
                    <div className="text-white truncate">{user.user_charities?.[0]?.charities?.name || '—'}</div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#172219]">
                    <div className="text-[#7aad8a] mb-1">Joined</div>
                    <div className="text-white">{format(new Date(user.created_at), 'dd MMM yy')}</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#1f3527] flex gap-2">
                  <button onClick={() => setConfirmToggle(user)}
                    className={`text-xs px-4 py-2 rounded-lg border font-medium flex-1 transition-all
                      ${user.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {user.is_active ? 'Active — tap to deactivate' : 'Inactive — tap to activate'}
                  </button>
                  <button onClick={() => setScoresUser(user)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-[#7aad8a] border border-[#1f3527] flex items-center gap-1 hover:bg-[#172219]">
                    <Target className="w-3 h-3" /> Scores
                  </button>
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
        {scoresUser && (
          <AdminScoresPanel user={scoresUser} onClose={() => setScoresUser(null)} />
        )}
        {confirmToggle && (
          <ConfirmModal
            title={confirmToggle.is_active ? 'Deactivate User' : 'Activate User'}
            message={confirmToggle.is_active
              ? `Deactivate ${confirmToggle.first_name} ${confirmToggle.last_name}? They will lose access to the platform.`
              : `Activate ${confirmToggle.first_name} ${confirmToggle.last_name}? They will regain full access.`}
            confirmLabel={confirmToggle.is_active ? 'Deactivate' : 'Activate'}
            confirmClass={confirmToggle.is_active
              ? 'bg-[#f87171] text-[#0a0f0d] hover:bg-[#ef4444] font-semibold rounded-xl px-4'
              : 'btn-accent'}
            loading={togglingId === confirmToggle.id}
            onConfirm={() => toggleActive(confirmToggle)}
            onClose={() => setConfirmToggle(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}