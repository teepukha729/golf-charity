import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[#1f3527] bg-[#0a0f0d] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center text-[#0a0f0d] font-bold text-lg">
                ⛳
              </div>
              <div>
                <span className="font-display font-bold text-xl text-white">Golf</span>
                <span className="font-display font-bold text-xl text-[#4ade80]">Charity</span>
              </div>
            </div>
            <p className="text-[#7aad8a] text-sm leading-relaxed max-w-xs">
              A platform where your love of golf creates real impact. Track scores, win prizes, and support the charities that matter to you.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-3">
              {[
                { href: '/how-it-works', label: 'How It Works' },
                { href: '/charities', label: 'Charities' },
                { href: '/subscribe', label: 'Subscribe' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#7aad8a] hover:text-[#4ade80] text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Account</h4>
            <ul className="space-y-3">
              {[
                { href: '/login', label: 'Log In' },
                { href: '/register', label: 'Create Account' },
                { href: '/dashboard', label: 'Dashboard' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#7aad8a] hover:text-[#4ade80] text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="section-divider mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#7aad8a] text-xs">
            © {new Date().getFullYear()} Golf Charity Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="text-[#7aad8a] text-xs">Platform is live and active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
