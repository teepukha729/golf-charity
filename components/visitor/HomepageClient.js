'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Trophy, TrendingUp, ArrowRight, Star, Users, Gift, Target } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import Navbar from '../layout/Navbar';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function StatCard({ icon: Icon, value, label, color = '#4ade80' }) {
  const [ref, inView] = useInView({ triggerOnce: true });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      className="stat-card card-hover text-center"
    >
      <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="text-3xl font-display font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-[#7aad8a]">{label}</div>
    </motion.div>
  );
}

function CharityCard({ charity }) {
  return (
    <motion.div variants={fadeUp} className="stat-card card-hover">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a472a] to-[#2d6a4f] flex items-center justify-center text-[#4ade80] font-bold text-xl flex-shrink-0">
          {charity.logo_url ? (
            <img src={charity.logo_url} alt={charity.name} className="w-full h-full rounded-xl object-cover" />
          ) : (
            <Heart className="w-6 h-6" />
          )}
        </div>
        <div>
          <span className="text-xs text-[#7aad8a] uppercase tracking-wider">{charity.category}</span>
          <h3 className="font-semibold text-white mt-1">{charity.name}</h3>
        </div>
      </div>
      <p className="text-sm text-[#7aad8a] line-clamp-3 leading-relaxed">{charity.description}</p>
      {charity.total_raised > 0 && (
        <div className="mt-4 pt-4 border-t border-[#1f3527]">
          <span className="text-xs text-[#4ade80]">£{parseFloat(charity.total_raised).toFixed(0)} raised</span>
        </div>
      )}
    </motion.div>
  );
}

export default function HomepageClient({ stats, featuredCharities, latestDraw }) {
  const [heroRef, heroInView] = useInView({ triggerOnce: true });
  const [howRef, howInView] = useInView({ triggerOnce: true });
  const [charityRef, charityInView] = useInView({ triggerOnce: true });

  const steps = [
    {
      icon: '🏌️',
      title: 'Subscribe',
      desc: 'Choose monthly or yearly plan and join the platform',
      color: '#4ade80',
    },
    {
      icon: '📊',
      title: 'Enter Scores',
      desc: 'Log your latest 5 Stableford scores after each round',
      color: '#d4af37',
    },
    {
      icon: '🎰',
      title: 'Monthly Draw',
      desc: 'Your scores become your lottery numbers in our monthly draw',
      color: '#a78bfa',
    },
    {
      icon: '❤️',
      title: 'Give Back',
      desc: 'A portion of every subscription goes to your chosen charity',
      color: '#f87171',
    },
  ];

  return (
    <div className="grain">
      <Navbar />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f0d] via-[#111a14] to-[#0a0f0d]" />
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[#4ade80] opacity-[0.04] blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#d4af37] opacity-[0.03] blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,#0a0f0d_100%)]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center py-32">
          <motion.div
            ref={heroRef}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            variants={stagger}
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2d5c3f] bg-[#172219] text-sm text-[#4ade80] mb-8">
              <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
              Subscription-based golf platform with charity impact
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
              Play Golf.{' '}
              <span className="gradient-text">Win Prizes.</span>
              <br />
              Change Lives.
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-[#7aad8a] max-w-2xl mx-auto mb-10 leading-relaxed">
              Enter your Stableford scores, participate in monthly draws, and support the charities that matter to you — all in one emotionally engaging platform.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/subscribe" className="btn-accent text-base py-4 px-8">
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/how-it-works" className="btn-ghost text-base py-4 px-8">
                How It Works
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div variants={fadeUp} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Active Players', value: stats.activeSubscribers > 0 ? stats.activeSubscribers.toLocaleString() : '—' },
                { label: 'Charities Supported', value: stats.totalCharities || '—' },
                { label: 'Total Prize Pool', value: stats.totalPrizePool > 0 ? `£${parseInt(stats.totalPrizePool).toLocaleString()}` : '—' },
                { label: 'Prize Distributed', value: stats.totalPrizePaid > 0 ? `£${parseInt(stats.totalPrizePaid).toLocaleString()}` : '—' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-[#7aad8a] mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-5 h-8 rounded-full border border-[#2d5c3f] flex items-start justify-center pt-1.5">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 rounded-full bg-[#4ade80]"
            />
          </div>
        </div>
      </section>

      {/* Latest Draw Banner */}
      {latestDraw && (
        <section className="py-6 border-y border-[#1f3527] bg-gradient-to-r from-[#0a0f0d] via-[#172219] to-[#0a0f0d]">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Trophy className="w-6 h-6 text-[#d4af37]" />
              <div>
                <span className="text-sm text-[#7aad8a]">Latest Draw: </span>
                <span className="text-white font-semibold">{latestDraw.name}</span>
              </div>
              {latestDraw.winning_numbers?.length > 0 && (
                <div className="flex gap-2">
                  {latestDraw.winning_numbers.map((n, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-[#172219] border border-[#4ade80] flex items-center justify-center text-xs font-bold text-[#4ade80]">
                      {n}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href="/subscribe" className="btn-primary text-sm py-2 px-5">
              Join Next Draw
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            ref={howRef}
            initial="hidden"
            animate={howInView ? 'visible' : 'hidden'}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <span className="text-xs uppercase tracking-widest text-[#4ade80] mb-3 block">Simple Process</span>
              <h2 className="font-display text-4xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-[#7aad8a] max-w-xl mx-auto">Four simple steps to start playing, winning, and giving back.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {steps.map((step, i) => (
                <motion.div key={i} variants={fadeUp} className="relative text-center">
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-full h-px"
                      style={{ background: `linear-gradient(to right, ${step.color}40, transparent)` }} />
                  )}
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl"
                    style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                    {step.icon}
                  </div>
                  <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: step.color }}>
                    Step {i + 1}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-[#7aad8a] leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Prize Pool Section */}
      <section className="py-24 bg-gradient-to-b from-transparent via-[#111a14] to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#d4af37] mb-3 block">Monthly Draws</span>
              <h2 className="font-display text-4xl font-bold text-white mb-6">
                Three Prize Tiers.
                <br />
                <span className="gradient-text">Real Winnings.</span>
              </h2>
              <p className="text-[#7aad8a] leading-relaxed mb-8">
                Every month, your golf scores become your draw numbers. Match 3, 4, or all 5 to win. The jackpot rolls over if unclaimed — building life-changing prizes.
              </p>
              <Link href="/subscribe" className="btn-accent">
                Join the Next Draw
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="space-y-4">
              {[
                { match: '5-Number Match', share: '40%', rollover: true, tier: '5', desc: 'Jackpot — rolls over if unclaimed' },
                { match: '4-Number Match', share: '35%', rollover: false, tier: '4', desc: 'Split equally among winners' },
                { match: '3-Number Match', share: '25%', rollover: false, tier: '3', desc: 'Split equally among winners' },
              ].map((tier, i) => (
                <div key={i} className="stat-card flex items-center gap-6">
                  <div className={`text-3xl font-display font-bold tier-${tier.tier}`}>
                    {tier.share}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{tier.match}</div>
                    <div className="text-sm text-[#7aad8a]">{tier.desc}</div>
                  </div>
                  {tier.rollover && (
                    <span className="badge-gold text-xs px-3 py-1 rounded-full">Jackpot</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Charities */}
      {featuredCharities.length > 0 && (
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              ref={charityRef}
              initial="hidden"
              animate={charityInView ? 'visible' : 'hidden'}
              variants={stagger}
            >
              <motion.div variants={fadeUp} className="text-center mb-16">
                <span className="text-xs uppercase tracking-widest text-[#f87171] mb-3 block">Making Impact</span>
                <h2 className="font-display text-4xl font-bold text-white mb-4">
                  Featured Charities
                </h2>
                <p className="text-[#7aad8a] max-w-xl mx-auto">
                  Your subscription directly funds causes that matter. Choose your charity at signup.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {featuredCharities.map((charity) => (
                  <CharityCard key={charity.id} charity={charity} />
                ))}
              </div>

              <motion.div variants={fadeUp} className="text-center">
                <Link href="/charities" className="btn-ghost">
                  View All Charities
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a472a] to-[#0a0f0d]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,222,128,0.1),transparent_70%)]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="text-5xl mb-6">⛳</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Play, Win, and Give?
          </h2>
          <p className="text-lg text-[#7aad8a] mb-10 max-w-xl mx-auto">
            Join thousands of golfers making every round count — for prizes and for good.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/subscribe" className="btn-accent text-base py-4 px-10">
              Subscribe Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/register" className="btn-ghost text-base py-4 px-10">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
