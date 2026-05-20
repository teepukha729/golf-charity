'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Shield } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/charities', label: 'Charities' },
    { href: '/subscribe', label: 'Subscribe' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'glass border-b border-[#1f3527]' : 'glass border-b border-[#1f3527]'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center text-[#0a0f0d] font-bold text-lg transition-transform group-hover:scale-105">
            ⛳
          </div>
          <div>
            <span className="font-display font-bold text-lg text-white">Golf</span>
            <span className="font-display font-bold text-lg text-[#4ade80]">Charity</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#7aad8a] hover:text-white transition-colors text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Section */}
        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-[#2d5c3f] hover:border-[#4ade80] transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2d6a4f] to-[#4ade80] flex items-center justify-center text-xs font-bold text-white">
                  {session.user.name?.[0] || 'U'}
                </div>
                <span className="text-sm text-[#e8f5e9] max-w-[100px] truncate">
                  {session.user.name?.split(' ')[0]}
                </span>
                <ChevronDown className="w-4 h-4 text-[#7aad8a]" />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-52 glass border border-[#1f3527] rounded-xl overflow-hidden shadow-2xl"
                  >
                    {session.user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[#d4af37] hover:bg-[#1f3527] transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    {(session.user.hasEverSubscribed || session.user.role === 'admin') && (
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[#e8f5e9] hover:bg-[#1f3527] transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#4ade80]" />
                        Dashboard
                      </Link>
                    )}
                    <div className="h-px bg-[#1f3527] mx-4" />
                    <button
                      onClick={() => { signOut({ callbackUrl: '/' }); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#f87171] hover:bg-[#1f3527] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm py-2 px-5">
                Log In
              </Link>
              <Link href="/subscribe" className="btn-accent text-sm py-2 px-5">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-[#7aad8a]"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-[#1f3527] px-6 py-4 space-y-3"
          >
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-[#7aad8a] hover:text-white py-2 text-sm"
                onClick={() => setIsMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[#1f3527] flex flex-col gap-3">
              {session ? (
                <>
                  {(session.user.hasEverSubscribed || session.user.role === 'admin') && (
                    <Link href="/dashboard" className="btn-ghost text-sm text-center" onClick={() => setIsMobileOpen(false)}>
                      Dashboard
                    </Link>
                  )}
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-ghost text-sm text-red-400">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost text-sm text-center" onClick={() => setIsMobileOpen(false)}>
                    Log In
                  </Link>
                  <Link href="/subscribe" className="btn-accent text-sm text-center" onClick={() => setIsMobileOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}