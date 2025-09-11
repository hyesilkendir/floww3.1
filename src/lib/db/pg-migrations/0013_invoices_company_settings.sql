-- Invoices and Company Settings persistent storage (Supabase-First)
create extension if not exists "uuid-ossp";

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  -- currencies.id mevcut şemada text olduğu için text FK kullanıyoruz
  currency_id text not null references public.currencies(id),
  issue_date date not null,
  due_date date not null,
  description text,
  items jsonb,
  invoice_number text,
  net_amount numeric not null default 0,
  vat_rate numeric not null default 0,
  total_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  remaining_amount numeric not null default 0,
  status text not null default 'pending',
  is_recurring boolean not null default false,
  recurring_months int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill/ensure columns exist on existing deployments
alter table public.invoices add column if not exists description text;
alter table public.invoices add column if not exists items jsonb;
alter table public.invoices add column if not exists paid_amount numeric not null default 0;
alter table public.invoices add column if not exists remaining_amount numeric not null default 0;

create table if not exists public.company_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text not null,
  address text,
  phone text,
  email text,
  website text,
  tax_number text,
  light_mode_logo_url text,
  dark_mode_logo_url text,
  quote_logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


