-- 🚀 CLEAN SUPABASE-FIRST SCHEMA RESET
-- This will create a completely fresh, simple schema

-- ==========================================
-- 1️⃣ DROP ALL EXISTING TABLES
-- ==========================================

DROP TABLE IF EXISTS quote_items CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS pending_balances CASCADE;
DROP TABLE IF EXISTS regular_payments CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS bonuses CASCADE;
DROP TABLE IF EXISTS debts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS cash_accounts CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;
DROP TABLE IF EXISTS tevkifat_rates CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE; -- Remove custom users table
DROP TABLE IF EXISTS currencies CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS debt_status CASCADE;
DROP TYPE IF EXISTS payroll_period CASCADE;
DROP TYPE IF EXISTS quote_status CASCADE;
DROP TYPE IF EXISTS invoice_status CASCADE;

-- ==========================================
-- 2️⃣ CREATE CLEAN TYPES
-- ==========================================

CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE debt_status AS ENUM ('pending', 'paid', 'overdue');
CREATE TYPE payroll_period AS ENUM ('monthly', 'weekly', 'biweekly');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- ==========================================
-- 3️⃣ CREATE CLEAN TABLES (snake_case)
-- ==========================================

-- Currencies (shared)
CREATE TABLE currencies (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories (per user)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type transaction_type NOT NULL,
  color TEXT DEFAULT '#6b7280',
  icon TEXT,
  is_default BOOLEAN DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients (per user)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_number TEXT,
  contact_person TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  currency_id TEXT NOT NULL REFERENCES currencies(id),
  balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees (per user)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  net_salary DECIMAL(15,2) NOT NULL,
  currency_id TEXT NOT NULL REFERENCES currencies(id),
  payroll_period payroll_period NOT NULL,
  payment_day INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions (per user) 
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  client_id UUID REFERENCES clients(id),
  employee_id UUID REFERENCES employees(id),
  currency_id TEXT NOT NULL REFERENCES currencies(id),
  transaction_date DATE NOT NULL,
  is_vat_included BOOLEAN DEFAULT false,
  vat_rate DECIMAL(5,2) DEFAULT 0,
  is_recurring BOOLEAN DEFAULT false,
  recurring_period TEXT,
  next_recurring_date DATE,
  parent_transaction_id UUID REFERENCES transactions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4️⃣ INSERT DEFAULT DATA
-- ==========================================

-- Default currencies
INSERT INTO currencies (id, code, name, symbol, is_active) VALUES
('1', 'TRY', 'Turkish Lira', '₺', true),
('2', 'USD', 'US Dollar', '$', true),
('3', 'EUR', 'Euro', '€', true),
('4', 'GBP', 'British Pound', '£', true);

-- ==========================================
-- 5️⃣ CREATE INDEXES
-- ==========================================

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ==========================================
-- 6️⃣ ROW LEVEL SECURITY (Simple)
-- ==========================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies - users can only see their own data
CREATE POLICY "Users can manage their own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own employees" ON employees
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- Allow reading currencies for all authenticated users
CREATE POLICY "Authenticated users can read currencies" ON currencies
  FOR SELECT USING (auth.role() = 'authenticated');
