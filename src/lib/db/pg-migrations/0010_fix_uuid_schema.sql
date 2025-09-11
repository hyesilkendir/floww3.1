-- Fix schema to use UUIDs properly and remove foreign key constraints that cause issues

-- First, enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all foreign key constraints that cause issues with our custom auth
ALTER TABLE clients DROP CONSTRAINT IF EXISTS fk_clients_user_id;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS fk_employees_user_id;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_user_id;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_user_id;
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS fk_quotes_user_id;
ALTER TABLE debts DROP CONSTRAINT IF EXISTS fk_debts_user_id;
ALTER TABLE bonuses DROP CONSTRAINT IF EXISTS fk_bonuses_user_id;
ALTER TABLE company_settings DROP CONSTRAINT IF EXISTS fk_company_settings_user_id;
ALTER TABLE verification_tokens DROP CONSTRAINT IF EXISTS fk_verification_tokens_user_id;

-- Also drop currency foreign keys as they're optional
ALTER TABLE clients DROP CONSTRAINT IF EXISTS fk_clients_currency_id;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS fk_employees_currency_id;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_currency_id;
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS fk_quotes_currency_id;
ALTER TABLE debts DROP CONSTRAINT IF EXISTS fk_debts_currency_id;
ALTER TABLE bonuses DROP CONSTRAINT IF EXISTS fk_bonuses_currency_id;

-- Change ID columns to UUID type if they're not already
DO $$ 
BEGIN
    -- Users table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE users ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE users ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    -- Clients table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE clients ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE clients ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    -- Employees table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE employees ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE employees ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    -- Other tables
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE transactions ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE transactions ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE categories ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE categories ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'currencies' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE currencies ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE currencies ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE quotes ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE quotes ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quote_items' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE quote_items ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE quote_items ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debts' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE debts ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE debts ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bonuses' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE bonuses ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE bonuses ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE company_settings ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE company_settings ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tevkifat_rates' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE tevkifat_rates ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE tevkifat_rates ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_tokens' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE verification_tokens ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
        ALTER TABLE verification_tokens ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
END $$;

-- Change user_id columns to UUID as well if needed
DO $$ 
BEGIN
    -- Update foreign key columns to UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'user_id' AND data_type != 'uuid') THEN
        ALTER TABLE clients ALTER COLUMN user_id TYPE UUID USING uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'user_id' AND data_type != 'uuid') THEN
        ALTER TABLE employees ALTER COLUMN user_id TYPE UUID USING uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id' AND data_type != 'uuid') THEN
        ALTER TABLE transactions ALTER COLUMN user_id TYPE UUID USING uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'user_id' AND data_type != 'uuid') THEN
        ALTER TABLE categories ALTER COLUMN user_id TYPE UUID USING uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'user_id' AND data_type != 'uuid') THEN
        ALTER TABLE quotes ALTER COLUMN user_id TYPE UUID USING uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debts' AND column_name = 'user_id' AND data_type != 'uuid') THEN
        ALTER TABLE debts ALTER COLUMN user_id TYPE UUID USING uuid_generate_v4();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bonuses' AND column_name = 'user_id' AND data_type != 'uuid') THEN
        ALTER TABLE bonuses ALTER COLUMN user_id TYPE UUID USING uuid_generate_v4();
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients (user_id);
CREATE INDEX IF NOT EXISTS employees_user_id_idx ON employees (user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions (user_id);
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories (user_id);
CREATE INDEX IF NOT EXISTS quotes_user_id_idx ON quotes (user_id);
CREATE INDEX IF NOT EXISTS debts_user_id_idx ON debts (user_id);
CREATE INDEX IF NOT EXISTS bonuses_user_id_idx ON bonuses (user_id);

-- Add unique constraints for important fields to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS clients_name_user_id_unique ON clients (name, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS employees_name_user_id_unique ON employees (name, user_id);

-- Disable RLS completely since we use custom auth
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE currencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE bonuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE tevkifat_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens DISABLE ROW LEVEL SECURITY;
