-- Complete schema reset and clean setup
-- This will create a clean, working schema without conflicting constraints

-- Drop all foreign key constraints first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all foreign key constraints
    FOR r IN (SELECT constraint_name, table_name FROM information_schema.table_constraints 
              WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') 
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate tables in correct order
DROP TABLE IF EXISTS quote_items CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS bonuses CASCADE;
DROP TABLE IF EXISTS debts CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;
DROP TABLE IF EXISTS tevkifat_rates CASCADE;
DROP TABLE IF EXISTS currencies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Recreate enums if they don't exist
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE category_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payroll_period AS ENUM ('monthly', 'weekly', 'biweekly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bonus_type AS ENUM ('bonus', 'advance', 'overtime', 'commission');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE debt_status AS ENUM ('pending', 'paid', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE debt_type AS ENUM ('payable', 'receivable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table with UUID
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Currencies table 
CREATE TABLE currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Insert default currencies
INSERT INTO currencies (id, code, name, symbol, is_active) VALUES 
('1', 'TRY', 'Turkish Lira', '₺', true),
('2', 'USD', 'US Dollar', '$', true),
('3', 'EUR', 'Euro', '€', true)
ON CONFLICT (code) DO NOTHING;

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type category_type NOT NULL,
    color VARCHAR(7) NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_number VARCHAR(50),
    contact_person VARCHAR(255),
    contract_start_date TIMESTAMP,
    contract_end_date TIMESTAMP,
    user_id UUID NOT NULL,
    currency_id VARCHAR(10) DEFAULT '1',
    balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    emergency_contact TEXT,
    contract_start_date TIMESTAMP,
    contract_end_date TIMESTAMP,
    user_id UUID NOT NULL,
    currency_id VARCHAR(10) DEFAULT '1',
    net_salary DECIMAL(10,2) NOT NULL,
    payroll_period payroll_period DEFAULT 'monthly' NOT NULL,
    payment_day INTEGER DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency_id VARCHAR(10) DEFAULT '1',
    category_id UUID,
    client_id UUID,
    employee_id UUID,
    description TEXT,
    transaction_date TIMESTAMP NOT NULL,
    is_vat_included BOOLEAN DEFAULT false NOT NULL,
    vat_rate INTEGER DEFAULT 0,
    is_recurring BOOLEAN DEFAULT false NOT NULL,
    recurring_period VARCHAR(20),
    parent_transaction_id UUID,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Quotes table
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    status quote_status DEFAULT 'draft' NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    vat_amount DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    currency_id VARCHAR(10) DEFAULT '1',
    notes TEXT,
    terms_and_conditions TEXT,
    tevkifat_applied BOOLEAN DEFAULT false NOT NULL,
    tevkifat_rate VARCHAR(10),
    tevkifat_amount DECIMAL(15,2) DEFAULT 0.00,
    net_amount_after_tevkifat DECIMAL(15,2),
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Quote items table
CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0
);

-- Debts table
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency_id VARCHAR(10) DEFAULT '1',
    due_date TIMESTAMP NOT NULL,
    type debt_type NOT NULL,
    status debt_status DEFAULT 'pending' NOT NULL,
    description TEXT,
    client_id UUID,
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Bonuses table
CREATE TABLE bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL,
    type bonus_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency_id VARCHAR(10) DEFAULT '1',
    description TEXT NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Company settings table
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    tax_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tevkifat rates table
CREATE TABLE tevkifat_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) NOT NULL UNIQUE,
    numerator INTEGER NOT NULL,
    denominator INTEGER NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Verification tokens table
CREATE TABLE verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add unique constraints for important combinations
CREATE UNIQUE INDEX clients_name_user_id_unique ON clients (name, user_id);
CREATE UNIQUE INDEX employees_name_user_id_unique ON employees (name, user_id);

-- Add performance indexes
CREATE INDEX clients_user_id_idx ON clients (user_id);
CREATE INDEX employees_user_id_idx ON employees (user_id);
CREATE INDEX transactions_user_id_idx ON transactions (user_id);
CREATE INDEX categories_user_id_idx ON categories (user_id);
CREATE INDEX quotes_user_id_idx ON quotes (user_id);
CREATE INDEX debts_user_id_idx ON debts (user_id);
CREATE INDEX bonuses_user_id_idx ON bonuses (user_id);

-- Insert default tevkifat rates
INSERT INTO tevkifat_rates (id, code, numerator, denominator, description, is_active) VALUES 
('1', '9/10', 9, 10, 'Mimarlık ve Mühendislik Hizmetleri', true),
('2', '7/10', 7, 10, 'Yazılım ve Bilişim Hizmetleri', true),
('3', '5/10', 5, 10, 'Makine ve Teçhizat Kiralanması', true),
('4', '3/10', 3, 10, 'Gayrimenkul Kiralanması', true),
('5', '2/10', 2, 10, 'Taşımacılık Hizmetleri', true),
('6', '1/2', 1, 2, 'Temizlik Hizmetleri', true)
ON CONFLICT (code) DO NOTHING;

-- Disable RLS on all tables for custom auth
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
