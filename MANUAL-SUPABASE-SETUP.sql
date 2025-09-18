
-- FlowW3 Database Schema Setup - MANUAL EXECUTION REQUIRED
-- Execute this SQL in Supabase Dashboard > SQL Editor
-- URL: https://supabase.com/dashboard/project/ffqwomxrfvsjzpyeklvm/sql

-- =====================================================
-- 1. CREATE ENUMS
-- =====================================================
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payroll_period AS ENUM ('monthly', 'weekly', 'biweekly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CREATE CURRENCIES TABLE (FOUNDATION)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.currencies (
    id text PRIMARY KEY,
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    symbol text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Insert default currencies
INSERT INTO public.currencies (id, code, name, symbol, is_active) VALUES
('TRY', 'TRY', 'Turkish Lira', '₺', true),
('USD', 'USD', 'US Dollar', '$', true),
('EUR', 'EUR', 'Euro', '€', true),
('GBP', 'GBP', 'British Pound', '£', true)
ON CONFLICT (id) DO UPDATE SET
code = EXCLUDED.code,
name = EXCLUDED.name,
symbol = EXCLUDED.symbol,
is_active = EXCLUDED.is_active;

-- =====================================================
-- 3. CREATE CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
