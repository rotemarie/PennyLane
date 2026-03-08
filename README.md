# PennyLane - Personal Spending Tracker

A mobile-first PWA for tracking daily spending, budgeting by category, and saving toward goals. Built with Next.js + Supabase.

## Setup

### 1. Install dependencies

```bash
cd PennyLane
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **SQL Editor** and paste the contents of `supabase-schema.sql`, then run it
3. Go to **Settings → API** and copy:
   - **Project URL** (e.g. `https://abc123.supabase.co`)
   - **anon/public key**

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com), import the repo
3. Add the two env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy

## Install as PWA on phone

After deploying, open the URL on your phone:
- **iOS**: Safari → Share → "Add to Home Screen"
- **Android**: Chrome → Menu → "Install app"

## Features

- **Transaction logging**: date, amount, category, payment method, notes
- **Smart categories**: rent, food, dining, transport, subscriptions, fashion, etc.
- **Monthly dashboard**: income vs expenses, pie chart breakdown, 6-month bar comparison
- **Budgeting**: set monthly caps per category, progress bars, 80% warnings
- **Cash flow**: cumulative chart, daily average, projected spending, recurring expense tracker
- **Savings goals**: visual progress bars, contribute/withdraw, deadline tracking
