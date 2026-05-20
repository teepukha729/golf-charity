import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default stripe;

export const PLANS = {
  monthly: {
    name: 'Monthly Plan',
    amount: 1000, // £10.00 in pence
    currency: 'gbp',
    interval: 'month',
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || null,
  },
  yearly: {
    name: 'Yearly Plan',
    amount: 9600, // £96.00 in pence (20% discount)
    currency: 'gbp',
    interval: 'year',
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || null,
  },
};

export const PRIZE_POOL_PERCENTAGE = 0.60; // 60% to prize pool
export const CHARITY_MIN_PERCENTAGE = 0.10; // 10% minimum to charity

export const calculatePrizePool = (subscriberCount, planBreakdown) => {
  const totalRevenue = planBreakdown.monthly * 10 + planBreakdown.yearly * 8; // monthly average
  const prizePoolTotal = totalRevenue * PRIZE_POOL_PERCENTAGE;

  return {
    total: prizePoolTotal,
    jackpot: prizePoolTotal * 0.40, // 40%
    fourMatch: prizePoolTotal * 0.35, // 35%
    threeMatch: prizePoolTotal * 0.25, // 25%
  };
};

export const createStripeCustomer = async (email, name) => {
  return stripe.customers.create({ email, name });
};

export const createCheckoutSession = async ({ customerId, plan, userId, successUrl, cancelUrl }) => {
  const planConfig = PLANS[plan];

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: planConfig.currency,
          product_data: {
            name: planConfig.name,
            description: `Golf Charity Platform - ${planConfig.name}`,
          },
          unit_amount: planConfig.amount,
          recurring: {
            interval: planConfig.interval,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      plan,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
};
