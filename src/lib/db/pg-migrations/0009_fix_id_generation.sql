-- Fix ID generation to use UUID instead of VARCHAR
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update all tables to use UUID as primary key with default generation
-- This will not affect existing data, only new inserts

-- Update clients table
ALTER TABLE clients ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update employees table  
ALTER TABLE employees ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update transactions table
ALTER TABLE transactions ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update categories table
ALTER TABLE categories ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update quotes table
ALTER TABLE quotes ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update quote_items table
ALTER TABLE quote_items ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update debts table
ALTER TABLE debts ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update bonuses table
ALTER TABLE bonuses ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update company_settings table
ALTER TABLE company_settings ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update verification_tokens table
ALTER TABLE verification_tokens ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update users table
ALTER TABLE users ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update currencies table
ALTER TABLE currencies ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update tevkifat_rates table
ALTER TABLE tevkifat_rates ALTER COLUMN id SET DEFAULT uuid_generate_v4();
