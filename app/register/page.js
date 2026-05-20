'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { label: 'At least 8 characters', pass: form.password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(form.password) },
    { label: 'Passwords match', pass: form.password === form.confirm && form.confirm.length > 0 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); setLoading(false); return; }
      toast.success('Account created! Signing you in...');
      const signInRes = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (signInRes?.ok) router.push('/subscribe');
      else router.push('/login');
    } catch {
      toast.error('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,222,128,0.05),transparent_70%)]" />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center text-[#0a0f0d] font-bold text-lg">⛳</div>
            <span className="font-display font-bold text-xl text-white">Golf<span className="text-[#4ade80]">Charity</span></span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-[#7aad8a] text-sm">Join the platform and start making a difference</p>
        </div>

        <div className="stat-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#7aad8a] mb-2">First Name</label>
                <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="input-dark" placeholder="John" required />
              </div>
              <div>
                <label className="block text-sm text-[#7aad8a] mb-2">Last Name</label>
                <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="input-dark" placeholder="Smith" required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#7aad8a] mb-2">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-dark" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="block text-sm text-[#7aad8a] mb-2">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-dark pr-12" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7aad8a]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#7aad8a] mb-2">Confirm Password</label>
              <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} className="input-dark" placeholder="••••••••" required />
            </div>

            {form.password && (
              <div className="space-y-1">
                {passwordChecks.map((c, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs ${c.pass ? 'text-[#4ade80]' : 'text-[#5a8a6a]'}`}>
                    <Check className="w-3 h-3" />
                    {c.label}
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-accent w-full justify-center py-3 disabled:opacity-60 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-[#0a0f0d] border-t-transparent rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1f3527] text-center text-sm text-[#7aad8a]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#4ade80] hover:underline">Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
