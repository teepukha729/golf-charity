'use client';
// app/(admin)/admin/charities/page.js
// UPDATED: Rich content editor + Cloudinary media uploads

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, Heart, Check, Star, Upload,
  X, Image, Type, Quote, Heading, Link2, Loader2,
  Eye, GripVertical, Globe, Mail, Hash, Calendar,
} from 'lucide-react';
import Modal, { ConfirmModal } from '@/components/ui/Modal';

// ─── Cloudinary Upload Hook ────────────────────────────────────────────────
function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file, type = 'general') => {
    if (!file) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      const res = await fetch('/api/upload/charity', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data.url;
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}

// ─── Image Upload Input ────────────────────────────────────────────────────
function ImageUploadField({ label, value, onChange, type = 'general', hint }) {
  const { upload, uploading } = useCloudinaryUpload();
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file, type);
    if (url) onChange(url);
  };

  return (
    <div>
      <label className="block text-sm text-[#7aad8a] mb-2 font-medium">{label}</label>
      {hint && <p className="text-xs text-[#5a8a6a] mb-2">{hint}</p>}
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="input-dark flex-1 text-sm"
          placeholder="URL or upload below"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5 flex-shrink-0 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {value && (
        <div className="mt-2 relative group w-24 h-16 rounded-lg overflow-hidden border border-[#1f3527]">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Gallery Upload ────────────────────────────────────────────────────────
function GalleryUploadField({ value = [], onChange }) {
  const { upload, uploading } = useCloudinaryUpload();
  const inputRef = useRef();

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const uploads = await Promise.all(files.slice(0, 10 - value.length).map(f => upload(f, 'gallery')));
    const urls = uploads.filter(Boolean);
    if (urls.length) onChange([...value, ...urls]);
  };

  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Gallery Images</label>
      <p className="text-xs text-[#5a8a6a] mb-3">Upload up to 10 images shown on the charity detail page</p>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {value.map((url, i) => (
          <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-[#1f3527]">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
        {value.length < 10 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-[#1f3527] flex flex-col items-center justify-center text-[#5a8a6a] hover:border-[#4ade80] hover:text-[#4ade80] transition-all disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span className="text-[10px] mt-1">{uploading ? 'Uploading' : 'Add'}</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
    </div>
  );
}

// ─── Rich Content Editor ───────────────────────────────────────────────────
const BLOCK_TYPES = [
  { type: 'paragraph', icon: Type, label: 'Paragraph' },
  { type: 'heading', icon: Heading, label: 'Heading' },
  { type: 'quote', icon: Quote, label: 'Quote' },
  { type: 'image', icon: Image, label: 'Image' },
];

function ContentBlock({ block, index, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const { upload, uploading } = useCloudinaryUpload();
  const fileRef = useRef();

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file, 'content');
    if (url) onUpdate({ ...block, url });
  };

  return (
    <div className="group relative p-4 rounded-xl bg-[#172219] border border-[#1f3527] hover:border-[#2d5c3f] transition-all">
      {/* Block type badge */}
      <div className="flex items-center gap-2 mb-3">
        <GripVertical className="w-4 h-4 text-[#3a5a45] cursor-grab" />
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a2e23] border border-[#1f3527] text-[#7aad8a] uppercase tracking-wider">
          {block.type}
        </span>
        <div className="ml-auto flex gap-1">
          {!isFirst && (
            <button type="button" onClick={onMoveUp} className="text-[#3a5a45] hover:text-[#7aad8a] text-xs px-1.5">↑</button>
          )}
          {!isLast && (
            <button type="button" onClick={onMoveDown} className="text-[#3a5a45] hover:text-[#7aad8a] text-xs px-1.5">↓</button>
          )}
          <button type="button" onClick={onRemove} className="text-[#3a5a45] hover:text-[#f87171] ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Paragraph / Heading */}
      {(block.type === 'paragraph' || block.type === 'heading') && (
        <textarea
          value={block.content || ''}
          onChange={e => onUpdate({ ...block, content: e.target.value })}
          placeholder={block.type === 'heading' ? 'Section heading...' : 'Write your content here...'}
          className={`input-dark w-full resize-none ${block.type === 'heading' ? 'h-12 font-bold text-base' : 'h-28 text-sm'}`}
        />
      )}

      {/* Quote */}
      {block.type === 'quote' && (
        <div className="space-y-2">
          <textarea
            value={block.content || ''}
            onChange={e => onUpdate({ ...block, content: e.target.value })}
            placeholder="Quote text..."
            className="input-dark w-full resize-none h-20 text-sm italic"
          />
          <input
            value={block.attribution || ''}
            onChange={e => onUpdate({ ...block, attribution: e.target.value })}
            placeholder="Attribution (optional)"
            className="input-dark text-sm"
          />
        </div>
      )}

      {/* Image block */}
      {block.type === 'image' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={block.url || ''}
              onChange={e => onUpdate({ ...block, url: e.target.value })}
              placeholder="Image URL or upload"
              className="input-dark flex-1 text-sm"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-ghost text-xs px-3 flex items-center gap-1.5 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          {block.url && (
            <img src={block.url} alt="" className="w-full max-h-40 object-cover rounded-lg border border-[#1f3527]" />
          )}
          <input
            value={block.caption || ''}
            onChange={e => onUpdate({ ...block, caption: e.target.value })}
            placeholder="Caption (optional)"
            className="input-dark text-sm"
          />
        </div>
      )}
    </div>
  );
}

function RichContentEditor({ content = [], onChange }) {
  const addBlock = (type) => {
    onChange([...content, { type, content: '', url: '', caption: '', attribution: '' }]);
  };

  const updateBlock = (i, updated) => {
    const next = [...content];
    next[i] = updated;
    onChange(next);
  };

  const removeBlock = (i) => onChange(content.filter((_, idx) => idx !== i));

  const moveBlock = (i, direction) => {
    const next = [...content];
    const j = i + direction;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Rich Content</label>
      <p className="text-xs text-[#5a8a6a] mb-3">Build the charity's detail page with content blocks</p>

      <div className="space-y-3 mb-4">
        <AnimatePresence>
          {content.map((block, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <ContentBlock
                block={block}
                index={i}
                onUpdate={updated => updateBlock(i, updated)}
                onRemove={() => removeBlock(i)}
                onMoveUp={() => moveBlock(i, -1)}
                onMoveDown={() => moveBlock(i, 1)}
                isFirst={i === 0}
                isLast={i === content.length - 1}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-[#1f3527] text-[#7aad8a] hover:border-[#4ade80] hover:text-[#4ade80] transition-all"
          >
            <Icon className="w-3 h-3" />
            + {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Impact Stats Editor ───────────────────────────────────────────────────
function ImpactStatsEditor({ value = [], onChange }) {
  const add = () => onChange([...value, { label: '', value: '' }]);
  const update = (i, field, val) => {
    const next = [...value];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Impact Statistics</label>
      <div className="space-y-2 mb-2">
        {value.map((stat, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={stat.label}
              onChange={e => update(i, 'label', e.target.value)}
              placeholder="Label (e.g. People Helped)"
              className="input-dark flex-1 text-sm"
            />
            <input
              value={stat.value}
              onChange={e => update(i, 'value', e.target.value)}
              placeholder="Value (e.g. 50,000+)"
              className="input-dark w-32 text-sm"
            />
            <button type="button" onClick={() => remove(i)} className="text-[#f87171] hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="text-xs text-[#7aad8a] hover:text-[#4ade80] flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add Stat
      </button>
    </div>
  );
}

// ─── Main Form ─────────────────────────────────────────────────────────────
const tabs = ['Basic', 'Media', 'Content', 'Details'];

function CharityForm({ form, setForm }) {
  const [activeTab, setActiveTab] = useState('Basic');

  return (
    <div>
      {/* Tab nav */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[#172219] border border-[#1f3527]">
        {tabs.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-[#2d6a4f] text-white'
                : 'text-[#7aad8a] hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Basic Tab */}
      {activeTab === 'Basic' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-dark" placeholder="Charity name" />
            </div>
            <div>
              <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Category</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="input-dark" placeholder="e.g. Health, Children" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Short Bio</label>
            <textarea value={form.short_bio} onChange={e => setForm({ ...form, short_bio: e.target.value })}
              className="input-dark h-16 resize-none text-sm" placeholder="One-liner shown on cards and hero..." />
          </div>
          <div>
            <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-dark h-24 resize-none" placeholder="Full description (fallback if no rich content)" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Website URL</label>
              <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
                className="input-dark" placeholder="https://" />
            </div>
            <div>
              <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Custom Slug</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                className="input-dark font-mono text-sm" placeholder="auto-generated from name" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <input type="checkbox" id="featured" checked={form.isFeatured}
              onChange={e => setForm({ ...form, isFeatured: e.target.checked })}
              className="w-4 h-4 accent-[#d4af37]" />
            <label htmlFor="featured" className="text-sm text-[#7aad8a] cursor-pointer">Feature on homepage</label>
          </div>
        </div>
      )}

      {/* Media Tab */}
      {activeTab === 'Media' && (
        <div className="space-y-5">
          <ImageUploadField
            label="Logo"
            value={form.logo_url}
            onChange={v => setForm({ ...form, logo_url: v })}
            type="logo"
            hint="Square image, shown as thumbnail. Recommended: 200×200px"
          />
          <ImageUploadField
            label="Banner Image"
            value={form.banner_url}
            onChange={v => setForm({ ...form, banner_url: v })}
            type="banner"
            hint="Wide image for the card and hero. Recommended: 1200×400px"
          />
          <GalleryUploadField
            value={form.gallery_urls}
            onChange={v => setForm({ ...form, gallery_urls: v })}
          />
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'Content' && (
        <div className="space-y-5">
          <RichContentEditor
            content={form.content}
            onChange={v => setForm({ ...form, content: v })}
          />
          <ImpactStatsEditor
            value={form.impact_stats}
            onChange={v => setForm({ ...form, impact_stats: v })}
          />
          {/* Upcoming Events */}
          <div>
            <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Upcoming Events</label>
            <div className="space-y-2 mb-2">
              {(form.upcomingEvents || []).map((event, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={typeof event === 'string' ? event : event.name}
                    onChange={e => {
                      const next = [...(form.upcomingEvents || [])];
                      next[i] = e.target.value;
                      setForm({ ...form, upcomingEvents: next });
                    }}
                    placeholder="Event name or description"
                    className="input-dark flex-1 text-sm"
                  />
                  <button type="button"
                    onClick={() => setForm({ ...form, upcomingEvents: form.upcomingEvents.filter((_, idx) => idx !== i) })}
                    className="text-[#f87171]"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <button type="button"
              onClick={() => setForm({ ...form, upcomingEvents: [...(form.upcomingEvents || []), ''] })}
              className="text-xs text-[#7aad8a] hover:text-[#4ade80] flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Event
            </button>
          </div>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'Details' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Founded Year</label>
              <input type="number" value={form.founded_year || ''} onChange={e => setForm({ ...form, founded_year: e.target.value })}
                className="input-dark" placeholder="e.g. 1961" />
            </div>
            <div>
              <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Charity Number</label>
              <input value={form.registered_number || ''} onChange={e => setForm({ ...form, registered_number: e.target.value })}
                className="input-dark font-mono text-sm" placeholder="e.g. 225971" />
            </div>
            <div>
              <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Contact Email</label>
              <input type="email" value={form.contact_email || ''} onChange={e => setForm({ ...form, contact_email: e.target.value })}
                className="input-dark" placeholder="info@charity.org" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#7aad8a] mb-2 font-medium">Social Links</label>
            <div className="space-y-2">
              {['twitter', 'facebook', 'instagram', 'linkedin'].map(platform => (
                <div key={platform} className="flex items-center gap-2">
                  <span className="text-xs text-[#5a8a6a] w-20 capitalize">{platform}</span>
                  <input
                    value={(form.social_links || {})[platform] || ''}
                    onChange={e => setForm({ ...form, social_links: { ...(form.social_links || {}), [platform]: e.target.value } })}
                    className="input-dark flex-1 text-sm"
                    placeholder={`https://${platform}.com/...`}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-[#1f3527]">
            <p className="text-xs text-[#5a8a6a] mb-3 uppercase tracking-wider">SEO</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-[#7aad8a] mb-2">Meta Title</label>
                <input value={form.meta_title || ''} onChange={e => setForm({ ...form, meta_title: e.target.value })}
                  className="input-dark" placeholder="Defaults to charity name" />
              </div>
              <div>
                <label className="block text-sm text-[#7aad8a] mb-2">Meta Description</label>
                <textarea value={form.meta_description || ''} onChange={e => setForm({ ...form, meta_description: e.target.value })}
                  className="input-dark h-16 resize-none text-sm" placeholder="Defaults to description" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
const emptyForm = {
  name: '', slug: '', description: '', short_bio: '', category: '', website: '',
  logo_url: '', banner_url: '', gallery_urls: [], content: [], impact_stats: [],
  isFeatured: false, upcomingEvents: [], founded_year: '', registered_number: '',
  contact_email: '', social_links: {}, meta_title: '', meta_description: '',
};

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

    if (res.ok) {
      // 👇 Trigger revalidation so visitor pages update immediately
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: data.charity?.slug || form.slug }),
      });

      toast.success(`Charity ${isEdit ? 'updated' : 'created'}!`);
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      fetchCharities();
    } else {
      toast.error(data.error || 'Something went wrong');
    }
    setSaving(false);
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
    setForm({
      name: charity.name || '',
      slug: charity.slug || '',
      description: charity.description || '',
      short_bio: charity.short_bio || '',
      category: charity.category || '',
      website: charity.website || '',
      logo_url: charity.logo_url || '',
      banner_url: charity.banner_url || '',
      gallery_urls: charity.gallery_urls || [],
      content: charity.content || [],
      impact_stats: charity.impact_stats || [],
      isFeatured: charity.is_featured || false,
      upcomingEvents: charity.upcoming_events || [],
      founded_year: charity.founded_year || '',
      registered_number: charity.registered_number || '',
      contact_email: charity.contact_email || '',
      social_links: charity.social_links || {},
      meta_title: charity.meta_title || '',
      meta_description: charity.meta_description || '',
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-1">Charities</h1>
          <p className="text-[#7aad8a] text-sm">Manage charity listings and rich content</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }}
          className="btn-accent text-sm py-2 px-5 flex-shrink-0 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Charity
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 rounded-xl loading-skeleton" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {charities.map((charity, i) => (
            <motion.div key={charity.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }} className="stat-card">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#172219] border border-[#1f3527] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {charity.logo_url
                    ? <img src={charity.logo_url} alt={charity.name} className="w-full h-full object-contain p-1.5 rounded-xl" />
                    : <Heart className="w-5 h-5 text-[#f87171]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <h3 className="font-semibold text-white text-sm">{charity.name}</h3>
                    {charity.is_featured && (
                      <span className="badge-gold text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" />Featured
                      </span>
                    )}
                    {!charity.is_active && (
                      <span className="badge-inactive text-[10px] px-1.5 py-0.5 rounded-full">Inactive</span>
                    )}
                    {charity.content?.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1a2e23] border border-[#1f3527] text-[#7aad8a]">
                        {charity.content.length} blocks
                      </span>
                    )}
                  </div>
                  {charity.category && (
                    <div className="text-[11px] text-[#7aad8a] uppercase tracking-wider mb-1">{charity.category}</div>
                  )}
                  {charity.slug && (
                    <div className="text-[11px] text-[#3a5a45] font-mono mb-1">/{charity.slug}</div>
                  )}
                  <p className="text-xs text-[#5a8a6a] line-clamp-2 leading-relaxed">
                    {charity.short_bio || charity.description}
                  </p>
                </div>
              </div>

              {charity.total_raised > 0 && (
                <div className="mt-3 flex gap-3">
                  <div className="flex items-center gap-1 text-xs text-[#7aad8a]">
                    <Heart className="w-3 h-3 text-[#f87171]" />
                    £{parseFloat(charity.total_raised).toLocaleString()} raised
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#1f3527]">
                <button onClick={() => handleToggleFeatured(charity)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                    charity.is_featured
                      ? 'border-[#d4af37]/40 text-[#d4af37] bg-[#d4af37]/5'
                      : 'border-[#1f3527] text-[#7aad8a] hover:border-[#d4af37]/40'
                  }`}>
                  <Star className="w-3 h-3" />{charity.is_featured ? 'Unfeature' : 'Feature'}
                </button>
                {charity.slug && (
                  <a href={`/charities/${charity.slug}`} target="_blank" rel="noopener noreferrer"
                    className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Preview
                  </a>
                )}
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
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        title={editId ? 'Edit Charity' : 'Add New Charity'}
        size="xl"
      >
        <CharityForm form={form} setForm={setForm} />
        <div className="flex gap-3 mt-6 pt-4 border-t border-[#1f3527]">
          <button onClick={() => { setShowForm(false); setEditId(null); }}
            className="btn-ghost flex-1 justify-center py-2.5 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="btn-accent flex-1 justify-center py-2.5 text-sm disabled:opacity-60 flex items-center gap-2">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : <><Check className="w-4 h-4" /> {editId ? 'Save Changes' : 'Create Charity'}</>}
          </button>
        </div>
      </Modal>

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
