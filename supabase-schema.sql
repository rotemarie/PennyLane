-- PennyLane Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Transactions table
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('expense', 'income')),
  amount numeric not null check (amount > 0),
  category text not null,
  date date not null,
  note text default '',
  payment_method text not null default 'max' check (payment_method in ('cash', 'max', 'payfor', 'bank_transfer', 'other')),
  is_recurring boolean not null default false,
  recurring_day integer check (recurring_day >= 1 and recurring_day <= 31),
  created_at timestamptz default now()
);

create index if not exists idx_transactions_date on transactions (date);
create index if not exists idx_transactions_type on transactions (type);
create index if not exists idx_transactions_recurring on transactions (is_recurring);

-- Budgets table
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  monthly_limit numeric not null check (monthly_limit > 0),
  month text not null, -- format: YYYY-MM
  created_at timestamptz default now(),
  unique (category, month)
);

create index if not exists idx_budgets_month on budgets (month);

-- Savings goals table
create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric not null default 0,
  deadline date,
  color text not null default '#22c55e',
  icon text not null default '🎯',
  created_at timestamptz default now()
);

-- Disable RLS for personal use (single user, no auth needed)
-- If you add auth later, enable RLS and add policies
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table savings_goals enable row level security;

-- Allow all operations (personal app, no auth)
create policy "Allow all on transactions" on transactions for all using (true) with check (true);
create policy "Allow all on budgets" on budgets for all using (true) with check (true);
create policy "Allow all on savings_goals" on savings_goals for all using (true) with check (true);
