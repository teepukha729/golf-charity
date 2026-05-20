'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { User, Camera, CreditCard, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className = 'w-4 h-4' }) {
  return (
    <div className={`${className} border-2 border-current border-t-transparent rounded-full animate-spin inline-block`} />
  );
}

// ─── Cancel Confirmation Modal ────────────────────────────────────────────────
function CancelConfirmModal({ subscription, onConfirm, onClose, loading }) {
  const planLabel = subscription?.plan === 'yearly' ? 'Yearly' : 'Monthly';
  const amount    = subscription?.amount
    ? `£${parseFloat(subscription.amount).toFixed(2)}`
    : subscription?.plan === 'yearly' ? '£96.00/yr' : '£10.00/mo';

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="stat-card w-full max-w-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1a1216] border border-[#f87171]/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-[#f87171]" />
          </div>
          <button onClick={onClose} className="text-[#7aad8a] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="font-display text-xl font-bold text-white mb-2">Cancel Subscription?</h2>

        {/* Plan summary */}
        <div className="my-4 p-3 rounded-xl bg-[#172219] border border-[#1f3527]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#7aad8a]">Current plan</span>
            <span className="text-white font-medium">{planLabel} · {amount}</span>
          </div>
        </div>

        <p className="text-sm text-[#7aad8a] mb-2 leading-relaxed">
          Cancelling will remove your access at the end of your current billing period.
        </p>
        <ul className="text-sm text-[#7aad8a] space-y-1.5 mb-6">
          <li className="flex items-start gap-2">
            <span className="text-[#f87171] mt-0.5">✕</span>
            You won't be entered into future monthly draws
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#f87171] mt-0.5">✕</span>
            Your golf scores will remain but draws will stop
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#4ade80] mt-0.5">✓</span>
            Access continues until the billing period ends
          </li>
        </ul>

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="btn-ghost flex-1 justify-center py-2.5 text-sm disabled:opacity-60">
            Keep Subscription
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 justify-center py-2.5 text-sm font-semibold rounded-xl bg-[#f87171] text-[#0a0f0d] hover:bg-[#ef4444] transition-colors disabled:opacity-60 flex items-center gap-2">
            {loading ? <Spinner className="w-4 h-4 border-[#0a0f0d]" /> : null}
            Yes, Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [subscription, setSubscription] = useState(null);

  // Fetch full subscription details (including amount)
  useEffect(() => {
    const fetchSub = async () => {
      const res = await fetch('/api/stripe/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription || null);
      }
    };
    fetchSub();
  }, []);

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      setAvatarPreview(reader.result);
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: reader.result }),
      });
      const data = await res.json();
      setUploadingAvatar(false);
      if (res.ok) {
        toast.success('Avatar updated!');
        await update({ avatar: data.avatarUrl });
      } else toast.error(data.error);
    };
    reader.readAsDataURL(file);
  }, [update]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  });

  const handleCancelSubscription = async () => {
    setCancellingSubscription(true);
    const res = await fetch('/api/stripe/subscription', { method: 'DELETE' });
    const data = await res.json();
    setCancellingSubscription(false);
    if (res.ok) {
      toast.success('Subscription cancelled successfully');
      setShowCancelModal(false);
      setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } else {
      toast.error(data.error || 'Failed to cancel subscription');
    }
  };

  if (!session) return null;
  const u = session.user;

  // Derive plan amount for display
  const planAmount = subscription?.amount
    ? `£${parseFloat(subscription.amount).toFixed(2)}`
    : u.subscriptionPlan === 'yearly' ? '£96.00/yr' : u.subscriptionPlan === 'monthly' ? '£10.00/mo' : null;

  const planLabel = u.subscriptionPlan === 'yearly' ? 'Yearly' : u.subscriptionPlan === 'monthly' ? 'Monthly' : u.subscriptionPlan;

  return (
    <div className="pt-4 md:pt-0 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">My Profile</h1>
        <p className="text-[#7aad8a] text-sm">Manage your account settings</p>
      </div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="stat-card mb-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-[#4ade80]" /> Profile Photo
        </h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#2d6a4f] to-[#4ade80] flex items-center justify-center text-white text-2xl font-bold">
              {avatarPreview || u.avatar
                ? <img src={avatarPreview || u.avatar} alt="avatar" className="w-full h-full object-cover" />
                : u.name?.[0] || 'U'}
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                <Spinner className="w-5 h-5 border-white" />
              </div>
            )}
          </div>
          <div {...getRootProps()} className="flex-1 border-2 border-dashed border-[#2d5c3f] rounded-xl p-4 text-center cursor-pointer hover:border-[#4ade80] transition-colors">
            <input {...getInputProps()} />
            <Camera className="w-6 h-6 text-[#7aad8a] mx-auto mb-2" />
            <p className="text-sm text-[#7aad8a]">Click or drag to change photo</p>
          </div>
        </div>
      </motion.div>

      {/* Account Info */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="stat-card mb-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-[#4ade80]" /> Account Information
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between p-3 rounded-xl bg-[#172219]">
            <span className="text-sm text-[#7aad8a]">Name</span>
            <span className="text-sm text-white">{u.name}</span>
          </div>
          <div className="flex justify-between p-3 rounded-xl bg-[#172219]">
            <span className="text-sm text-[#7aad8a]">Email</span>
            <span className="text-sm text-white">{u.email}</span>
          </div>
          <div className="flex justify-between p-3 rounded-xl bg-[#172219]">
            <span className="text-sm text-[#7aad8a]">Role</span>
            <span className="text-sm text-white capitalize">{u.role}</span>
          </div>
          {/* Subscription row with plan + amount */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#172219]">
            <span className="text-sm text-[#7aad8a]">Subscription</span>
            <div className="text-right">
              {u.hasActiveSubscription ? (
                <>
                  <span className="badge-active text-xs px-2 py-0.5 rounded-full capitalize inline-block mb-0.5">
                    {planLabel} · Active
                  </span>
                  {planAmount && (
                    <div className="text-xs text-[#7aad8a]">{planAmount}</div>
                  )}
                </>
              ) : (
                <span className="badge-inactive text-xs px-2 py-0.5 rounded-full">Inactive</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Subscription Management */}
      {u.hasActiveSubscription && u.role !== 'admin' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="stat-card mb-6 border border-[#f87171]/20">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#f87171]" /> Manage Subscription
          </h3>

          {/* Plan summary card */}
          <div className="p-4 rounded-xl bg-[#172219] border border-[#1f3527] mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white capitalize">
                  {planLabel} Plan
                </div>
                {planAmount && (
                  <div className="text-xs text-[#7aad8a] mt-0.5">{planAmount}</div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#4ade80]">
                <CheckCircle2 className="w-4 h-4" />
                Active
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#1a1216] border border-[#f87171]/20 mb-4">
            <AlertTriangle className="w-4 h-4 text-[#f87171] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#7aad8a] leading-relaxed">
              Cancelling your subscription will remove your access at the end of the current billing period.
              You won't be entered into future draws.
            </p>
          </div>

          <button onClick={() => setShowCancelModal(true)}
            className="text-sm text-[#f87171] border border-[#f87171]/40 px-5 py-2.5 rounded-xl hover:bg-[#1a1216] transition-colors font-medium flex items-center gap-2">
            Cancel Subscription
          </button>
        </motion.div>
      )}

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <CancelConfirmModal
            subscription={subscription || { plan: u.subscriptionPlan }}
            loading={cancellingSubscription}
            onConfirm={handleCancelSubscription}
            onClose={() => setShowCancelModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}