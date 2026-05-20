'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Target, Heart, Trophy, User, LogOut,
  ChevronRight, Menu, X, Gift, TrendingUp
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Overview'   },
  { href: '/dashboard/scores',    icon: Target,          label: 'My Scores'  },
  { href: '/dashboard/charity',   icon: Heart,           label: 'My Charity' },
  { href: '/dashboard/draws',     icon: Trophy,          label: 'Draws'      },
  { href: '/dashboard/winnings',  icon: Gift,            label: 'Winnings'   },
  { href: '/dashboard/profile',   icon: User,            label: 'Profile'    },
];

export default function DashboardSidebar({ user }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-[#1f3527]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center text-[#0a0f0d] font-bold">⛳</div>
          <span className="font-display font-bold text-white">Golf<span className="text-[#4ade80]">Charity</span></span>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-[#1f3527]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#172219]">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#2d6a4f] to-[#4ade80] flex items-center justify-center font-bold text-white flex-shrink-0">
            {user.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : user.name?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user.name}</div>
            <div className="text-xs text-[#7aad8a] truncate">{user.email}</div>
          </div>
          {user.role === 'admin' && (
            <span className="badge-gold text-xs px-2 py-0.5 rounded-full ml-auto flex-shrink-0">Admin</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-[#1a472a] text-[#4ade80] border border-[#2d5c3f]'
                  : 'text-[#7aad8a] hover:bg-[#172219] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3" />}
            </Link>
          );
        })}

        {user.role === 'admin' && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#d4af37] hover:bg-[#172219] transition-all mt-2 border border-[#2d3a1f]"
          >
            <TrendingUp className="w-4 h-4" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-[#1f3527] space-y-1">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-[#f87171] hover:bg-[#1f1a1a] w-full transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (md and above) ─────────────────────────────── */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#0d1610] border-r border-[#1f3527] flex-col z-40">
        <SidebarContent />
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0d1610] border-b border-[#1f3527] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center text-[#0a0f0d] font-bold text-sm">⛳</div>
          <span className="font-display font-bold text-white text-sm">Golf<span className="text-[#4ade80]">Charity</span></span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[#7aad8a]">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="md:hidden fixed left-0 top-0 h-full w-72 bg-[#0d1610] border-r border-[#1f3527] z-50"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for mobile */}
      <div className="md:hidden h-14" />
    </>
  );
}