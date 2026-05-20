'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Users, Trophy, Heart, Award, BarChart2, LogOut, ChevronRight, Menu, X, Shield, CreditCard } from 'lucide-react';

const navItems = [
  { href: '/admin',               icon: LayoutDashboard, label: 'Overview'            },
  { href: '/admin/users',         icon: Users,           label: 'Users'               },
  { href: '/admin/subscriptions', icon: CreditCard,      label: 'Subscriptions'       },
  { href: '/admin/draws',         icon: Trophy,          label: 'Draws'               },
  { href: '/admin/charities',     icon: Heart,           label: 'Charities'           },
  { href: '/admin/winners',       icon: Award,           label: 'Winners'             },
  { href: '/admin/reports',       icon: BarChart2,       label: 'Reports & Analytics' },
];

export default function AdminSidebar({ user }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-[#2d3a1f]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#f59e0b] flex items-center justify-center text-[#0a0f0d] font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Admin Panel</div>
            <div className="text-[#7aad8a] text-xs">Golf Charity Platform</div>
          </div>
        </Link>
      </div>

      <div className="p-4 border-b border-[#2d3a1f]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#172219]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f59e0b] flex items-center justify-center font-bold text-[#0a0f0d] text-sm flex-shrink-0">
            {user.name?.[0] || 'A'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user.name}</div>
            <div className="text-xs badge-gold px-2 py-0.5 rounded-full inline-block">Administrator</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                isActive ? 'bg-[#1a2e0e] text-[#d4af37] border border-[#2d3a1f]' : 'text-[#7aad8a] hover:bg-[#172219] hover:text-white'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2d3a1f] space-y-1">
        {/* <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-[#7aad8a] hover:bg-[#172219] transition-all">
          <LayoutDashboard className="w-3 h-3" /> User Dashboard
        </Link> */}
        <button onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-[#f87171] hover:bg-[#1f1a1a] w-full transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:flex fixed left-0 top-0 h-full w-72 bg-[#0d1610] border-r border-[#1f3527] flex-col z-40">
        <SidebarContent />
      </div>
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0d1610] border-b border-[#1f3527] px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-[#d4af37] text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Admin Panel</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[#7aad8a]">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              className="md:hidden fixed left-0 top-0 h-full w-72 bg-[#0d1610] border-r border-[#1f3527] z-50">
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <div className="md:hidden h-14" />
    </>
  );
}