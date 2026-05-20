# ⛳ Golf Charity Platform

A subscription-based golf platform combining Stableford score tracking, monthly prize draws, and charitable giving.

## Tech Stack
- Next.js 14 App Router (JavaScript)
- Zustand (state management)
- Supabase (PostgreSQL database)
- NextAuth.js (authentication)
- Stripe (subscriptions & webhooks)
- Cloudinary (golf_charity folder for screenshots/avatars)
- Nodemailer (email notifications)
- Tailwind CSS + Framer Motion
- Highcharts (admin analytics)
- React Datepicker, React Hot Toast

## Setup

### 1. Run DB Schema
Run `lib/schema.sql` in Supabase SQL Editor.
Admin credentials: admin@golfcharity.com / Admin@123

### 2. Configure .env.local
All env vars are pre-filled in .env.local. Update with production values for deployment.

### 3. Stripe Webhook
Add webhook endpoint: https://your-domain/api/webhook/stripe
Events: checkout.session.completed, invoice.payment_succeeded, invoice.payment_failed, customer.subscription.deleted, customer.subscription.updated

### 4. Deploy
```bash
vercel --prod
```

## Features
- Visitor (SSR): Homepage, How It Works, Charities, Subscribe
- Subscriber: Score entry (1-45, max 5), Charity selection (10-100%), Draw history, Winnings + proof upload, Profile
- Admin: User management, Draw create/simulate/publish, Charity CRUD, Winner verification/payout, Highcharts reports
