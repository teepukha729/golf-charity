'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Check, ArrowRight, Star, Shield, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '£10',
    period: 'per month',
    yearlyEquiv: '£120/year',
    savings: null,
    features: [
      'Full platform access',
      'Monthly draw entry',
      'Score tracking (5 scores)',
      'Charity contribution (min 10%)',
      'Winner verification system',
      'Email notifications',
    ],
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '£96',
    period: 'per year',
    yearlyEquiv: '£8/month',
    savings: 'Save 20%',
    features: [
      'Everything in Monthly',
      '20% discount on annual plan',
      'Priority entry to draws',
      'Full draw history access',
      'Enhanced profile features',
      'VIP support',
    ],
    highlight: true,
  },
];

const benefits = [
  { icon: <Shield className="w-5 h-5" />, text: 'Secure Stripe payments' },
  { icon: <RefreshCw className="w-5 h-5" />, text: 'Cancel anytime' },
  { icon: <Star className="w-5 h-5" />, text: 'Monthly prize draws' },
];

export default function SubscribeClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!session) {
      router.push(`/login?redirect=/subscribe`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,222,128,0.06),transparent_70%)]" />
        <div className="relative max-w-2xl mx-auto px-6">
          <span className="text-xs uppercase tracking-widest text-[#4ade80] mb-4 block">Join Today</span>
          <h1 className="font-display text-5xl font-bold text-white mb-6">Choose Your Plan</h1>
          <p className="text-lg text-[#7aad8a]">
            Subscribe to enter monthly draws, track your scores, and support the charities you care about.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-4xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative cursor-pointer rounded-2xl p-8 border-2 transition-all ${
                selectedPlan === plan.id
                  ? 'border-[#4ade80] bg-[#111a14]'
                  : 'border-[#1f3527] bg-[#0d1610] hover:border-[#2d5c3f]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0a0f0d] text-xs font-bold">
                  MOST POPULAR
                </div>
              )}

              {plan.savings && (
                <div className="absolute top-4 right-4 badge-gold text-xs px-3 py-1 rounded-full">
                  {plan.savings}
                </div>
              )}

              <div className="mb-6">
                <div className="text-sm text-[#7aad8a] uppercase tracking-wider mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-display font-bold text-white">{plan.price}</span>
                  <span className="text-[#7aad8a] text-sm">{plan.period}</span>
                </div>
                <div className="text-xs text-[#5a8a6a] mt-1">{plan.yearlyEquiv}</div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#7aad8a]">
                    <Check className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className={`w-full py-3 rounded-xl text-sm font-semibold text-center border-2 transition-all ${
                selectedPlan === plan.id
                  ? 'bg-[#4ade80] border-[#4ade80] text-[#0a0f0d]'
                  : 'bg-transparent border-[#2d5c3f] text-[#7aad8a]'
              }`}>
                {selectedPlan === plan.id ? '✓ Selected' : 'Select Plan'}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Subscribe Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="btn-accent text-base py-4 px-12 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#0a0f0d] border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {session ? 'Subscribe Now' : 'Create Account & Subscribe'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {!session && (
            <p className="mt-4 text-sm text-[#7aad8a]">
              Already have an account?{' '}
              <Link href="/login?redirect=/subscribe" className="text-[#4ade80] hover:underline">
                Log in
              </Link>
            </p>
          )}

          <div className="flex items-center justify-center gap-6 mt-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[#5a8a6a]">
                <span className="text-[#4ade80]">{b.icon}</span>
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
