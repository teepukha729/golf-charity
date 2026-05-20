import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'How It Works | Golf Charity Platform',
  description: 'Learn how Golf Charity Platform combines Stableford scoring, monthly prize draws, and charitable giving into one seamless subscription experience.',
};

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      icon: '🏌️',
      title: 'Subscribe to the Platform',
      desc: 'Choose a monthly (£10/mo) or yearly (£96/yr) subscription. Your subscription funds the prize pool and supports your chosen charity.',
      details: ['Secure Stripe payment', 'Cancel anytime', 'Immediate access to all features'],
      color: '#4ade80',
    },
    {
      num: '02',
      icon: '⛳',
      title: 'Enter Your Stableford Scores',
      desc: 'After each round, log your Stableford score (1–45) with the date. Only your latest 5 scores are kept — they become your draw numbers.',
      details: ['Scores must be 1–45 (Stableford format)', 'Each score needs a date', 'Latest 5 scores auto-replace oldest'],
      color: '#d4af37',
    },
    {
      num: '03',
      icon: '🎰',
      title: 'Participate in Monthly Draws',
      desc: 'Every month, a draw is run using your 5 Stableford scores as your entry numbers. Match 3, 4, or 5 numbers to win.',
      details: ['Automatic entry with active subscription', 'Random or algorithmic draw types', 'Jackpot rolls over if no 5-match winner'],
      color: '#a78bfa',
    },
    {
      num: '04',
      icon: '🏆',
      title: 'Claim Your Prize',
      desc: 'Winners are notified by email. Upload a screenshot of your golf scores as proof. Admin verifies and processes payment.',
      details: ['Email notification on win', 'Upload proof via dashboard', 'Verification within 48 hours'],
      color: '#f59e0b',
    },
    {
      num: '05',
      icon: '❤️',
      title: 'Support Your Charity',
      desc: 'Minimum 10% of your subscription goes directly to your chosen charity. You can increase this percentage any time.',
      details: ['Choose from listed charities', 'Set contribution 10–100%', 'Independent donations also available'],
      color: '#f87171',
    },
  ];

  const prizeTiers = [
    { match: '5-Number Match', share: '40%', rollover: true, color: '#d4af37', label: 'Jackpot' },
    { match: '4-Number Match', share: '35%', rollover: false, color: '#c0c0c0', label: 'Silver' },
    { match: '3-Number Match', share: '25%', rollover: false, color: '#cd7f32', label: 'Bronze' },
  ];

  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,222,128,0.05),transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto px-6">
          <span className="text-xs uppercase tracking-widest text-[#4ade80] mb-4 block">Complete Guide</span>
          <h1 className="font-display text-5xl font-bold text-white mb-6">
            How It Works
          </h1>
          <p className="text-lg text-[#7aad8a] leading-relaxed">
            A subscription platform that turns your golf game into a force for good — with real prizes and real charitable impact every month.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 max-w-4xl mx-auto px-6">
        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={i} className="stat-card flex gap-8 items-start card-hover">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: step.color }}>
                    {step.num}
                  </span>
                  <h3 className="font-display font-bold text-xl text-white">{step.title}</h3>
                </div>
                <p className="text-[#7aad8a] mb-4 leading-relaxed">{step.desc}</p>
                <ul className="space-y-1">
                  {step.details.map((d, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-[#5a8a6a]">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: step.color }} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Prize Pool Breakdown */}
      <section className="py-16 bg-gradient-to-b from-transparent via-[#111a14] to-transparent">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-white mb-3">Prize Pool Distribution</h2>
            <p className="text-[#7aad8a]">60% of subscription revenue goes into the prize pool each month.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {prizeTiers.map((tier, i) => (
              <div key={i} className="stat-card text-center card-hover">
                <div className="text-4xl font-display font-bold mb-2" style={{ color: tier.color }}>
                  {tier.share}
                </div>
                <div className="font-semibold text-white mb-1">{tier.match}</div>
                <div className="text-sm text-[#7aad8a]">of monthly prize pool</div>
                {tier.rollover && (
                  <div className="mt-3 text-xs badge-gold px-3 py-1 rounded-full inline-block">
                    Rolls over if unclaimed
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-white mb-3">Common Questions</h2>
        </div>
        <div className="space-y-4">
          {[
            {
              q: 'What is Stableford scoring?',
              a: 'Stableford is a golf scoring system where points are awarded based on results at each hole relative to par. Scores typically range from 1 to 45 in a standard round.',
            },
            {
              q: 'When are draws held?',
              a: 'Draws are held once per month. All active subscribers with at least one score entered are automatically entered. You will receive an email notification with results.',
            },
            {
              q: 'What happens to the jackpot if nobody wins?',
              a: 'If no player matches all 5 numbers (5-match), the jackpot rolls over to the next month, making the prize bigger!',
            },
            {
              q: 'Can I change my charity?',
              a: 'Yes! You can update your charity selection and contribution percentage at any time from your dashboard.',
            },
            {
              q: 'How do I claim a prize?',
              a: 'You will be notified by email. Log in to your dashboard, navigate to Winnings, and upload a screenshot of your golf scores as proof. Admin will verify and process payment.',
            },
          ].map((faq, i) => (
            <div key={i} className="stat-card">
              <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
              <p className="text-sm text-[#7aad8a] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center px-6">
        <h2 className="font-display text-3xl font-bold text-white mb-4">Ready to Join?</h2>
        <p className="text-[#7aad8a] mb-8">Start your subscription today and enter your first monthly draw.</p>
        <Link href="/subscribe" className="btn-accent text-base py-4 px-10">
          Subscribe Now <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
