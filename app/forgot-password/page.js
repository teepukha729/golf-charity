'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, Mail, KeyRound, ShieldCheck } from 'lucide-react';

// ─── Step 1: Email Entry ────────────────────────────────────────────────────
function EmailStep({ onOtpSent }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }
      toast.success('OTP sent! Check your email.');
      onOtpSent(email);
    } catch {
      toast.error('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="email-step"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-[#0a0f0d]" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Forgot Password</h1>
        <p className="text-[#7aad8a] text-sm">Enter your email and we'll send you a one-time code</p>
      </div>

      <div className="stat-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-[#7aad8a] mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark"
              placeholder="your@email.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full justify-center py-3 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#0a0f0d] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Send OTP <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#1f3527] text-center text-sm text-[#7aad8a]">
          Remember your password?{' '}
          <Link href="/login" className="text-[#4ade80] hover:underline">Sign in</Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Step 2: OTP + New Password ─────────────────────────────────────────────
function ResetStep({ email, onSuccess }) {
  const [form, setForm] = useState({ otp: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const passwordChecks = [
    { label: 'At least 8 characters', pass: form.password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(form.password) },
    { label: 'Passwords match', pass: form.password === form.confirm && form.confirm.length > 0 },
  ];

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || 'Failed to resend');
      else toast.success('New OTP sent!');
    } catch {
      toast.error('Failed to resend OTP');
    }
    setResending(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.otp.length !== 6) return toast.error('Please enter the 6-digit OTP');

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: form.otp, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }
      toast.success('Password reset successfully!');
      onSuccess();
    } catch {
      toast.error('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="reset-step"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-7 h-7 text-[#0a0f0d]" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-[#7aad8a] text-sm">
          OTP sent to <span className="text-[#4ade80]">{email}</span>
        </p>
      </div>

      <div className="stat-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* OTP */}
          <div>
            <label className="block text-sm text-[#7aad8a] mb-2">One-Time Password (OTP)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })}
              className="input-dark tracking-[0.4em] text-center text-lg font-semibold"
              placeholder="• • • • • •"
              required
            />
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs text-[#7aad8a] hover:text-[#4ade80] transition-colors disabled:opacity-50"
              >
                {resending ? 'Resending…' : 'Resend OTP'}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm text-[#7aad8a] mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-dark pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7aad8a] hover:text-white"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm text-[#7aad8a] mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="input-dark pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7aad8a] hover:text-white"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password checks */}
          {form.password && (
            <div className="space-y-1">
              {passwordChecks.map((c, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs ${c.pass ? 'text-[#4ade80]' : 'text-[#5a8a6a]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.pass ? 'bg-[#4ade80]' : 'bg-[#5a8a6a]'}`} />
                  {c.label}
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full justify-center py-3 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#0a0f0d] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Reset Password <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#1f3527] text-center text-sm text-[#7aad8a]">
          <button
            onClick={() => window.location.reload()}
            className="text-[#4ade80] hover:underline"
          >
            ← Use a different email
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Step 3: Success ─────────────────────────────────────────────────────────
function SuccessStep() {
  return (
    <motion.div
      key="success-step"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center mx-auto mb-6">
        <ShieldCheck className="w-10 h-10 text-[#0a0f0d]" />
      </div>
      <h1 className="font-display text-3xl font-bold text-white mb-3">All Done!</h1>
      <p className="text-[#7aad8a] text-sm mb-8">
        Your password has been reset successfully. You can now sign in with your new password.
      </p>
      <Link href="/login" className="btn-accent justify-center py-3">
        Go to Sign In <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [step, setStep] = useState('email'); // 'email' | 'reset' | 'success'
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,222,128,0.05),transparent_70%)]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center text-[#0a0f0d] font-bold text-lg">
              ⛳
            </div>
            <span className="font-display font-bold text-xl text-white">
              Golf<span className="text-[#4ade80]">Charity</span>
            </span>
          </Link>
        </div>

        {/* Step indicator */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['email', 'reset'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s
                    ? 'bg-[#4ade80] text-[#0a0f0d]'
                    : (i === 0 && step === 'reset')
                    ? 'bg-[#1f3527] text-[#4ade80] border border-[#4ade80]'
                    : 'bg-[#1f3527] text-[#7aad8a]'
                }`}>
                  {i === 0 && step === 'reset' ? '✓' : i + 1}
                </div>
                {i < 1 && <div className={`w-8 h-px ${step === 'reset' ? 'bg-[#4ade80]' : 'bg-[#1f3527]'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 'email' && (
            <EmailStep
              onOtpSent={(em) => { setEmail(em); setStep('reset'); }}
            />
          )}
          {step === 'reset' && (
            <ResetStep
              email={email}
              onSuccess={() => setStep('success')}
            />
          )}
          {step === 'success' && <SuccessStep />}
        </AnimatePresence>
      </div>
    </div>
  );
}