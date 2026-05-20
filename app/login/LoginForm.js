'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error('Invalid email or password');
    } else {
      toast.success('Welcome back!');
      setLoading(true);
      router.push(redirect);
      router.refresh();
      setLoading(false);

    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,222,128,0.05),transparent_70%)]" />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center text-[#0a0f0d] font-bold text-lg">⛳</div>
            <span className="font-display font-bold text-xl text-white">Golf<span className="text-[#4ade80]">Charity</span></span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-[#7aad8a] text-sm">Sign in to your account</p>
        </div>

        <div className="stat-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-[#7aad8a] mb-2">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-dark" placeholder="your@email.com" required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm text-[#7aad8a]">Password</label>
                <Link href="/forgot-password" className="text-xs text-[#4ade80] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-dark pr-12" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7aad8a] hover:text-white">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-accent w-full justify-center py-3 disabled:opacity-60">
              {loading ? <div className="w-5 h-5 border-2 border-[#0a0f0d] border-t-transparent rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-[#1f3527] text-center text-sm text-[#7aad8a]">
            Don&apos;t have an account? <Link href="/register" className="text-[#4ade80] hover:underline">Create one</Link>
          </div>
        </div>

        {/* <div className="mt-4 p-3 rounded-lg border border-[#1f3527] bg-[#172219] text-xs text-[#7aad8a] text-center">
          Admin: <span className="text-[#d4af37]">admin@golfcharity.com</span> / <span className="text-[#d4af37]">Admin@123</span>
        </div> */}
      </motion.div>
    </div>
  );
}