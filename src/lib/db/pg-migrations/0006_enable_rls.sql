-- Enable Row Level Security (RLS) and set policies for all tables

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for users table (allow all operations for authenticated users)
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
    FOR ALL USING (auth.uid()::text = id);

-- Create policies for clients table (user_id based access)
DROP POLICY IF EXISTS "Users can manage their own clients" ON clients;
CREATE POLICY "Users can manage their own clients" ON clients
    FOR ALL USING (auth.uid()::text = user_id);

-- Create policies for employees table (user_id based access)
DROP POLICY IF EXISTS "Users can manage their own employees" ON employees;
CREATE POLICY "Users can manage their own employees" ON employees
    FOR ALL USING (auth.uid()::text = user_id);

-- Create policies for transactions table (user_id based access)
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
CREATE POLICY "Users can manage their own transactions" ON transactions
    FOR ALL USING (auth.uid()::text = user_id);

-- Create policies for categories table (user_id based access)
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
CREATE POLICY "Users can manage their own categories" ON categories
    FOR ALL USING (auth.uid()::text = user_id);

-- Create policies for quotes table (user_id based access)
DROP POLICY IF EXISTS "Users can manage their own quotes" ON quotes;
CREATE POLICY "Users can manage their own quotes" ON quotes
    FOR ALL USING (auth.uid()::text = user_id);

-- Create policies for debts table (user_id based access)
DROP POLICY IF EXISTS "Users can manage their own debts" ON debts;
CREATE POLICY "Users can manage their own debts" ON debts
    FOR ALL USING (auth.uid()::text = user_id);

-- Create policies for bonuses table (user_id based access)
DROP POLICY IF EXISTS "Users can manage their own bonuses" ON bonuses;
CREATE POLICY "Users can manage their own bonuses" ON bonuses
    FOR ALL USING (auth.uid()::text = user_id);

-- Create policies for quote_items table (through parent quote)
DROP POLICY IF EXISTS "Users can manage quote items" ON quote_items;
CREATE POLICY "Users can manage quote items" ON quote_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM quotes 
        WHERE quotes.id = quote_items.quote_id 
        AND auth.uid()::text = quotes.user_id
    ));

-- Create policies for company_settings table (allow all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can manage company settings" ON company_settings;
CREATE POLICY "Authenticated users can manage company settings" ON company_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for verification_tokens table (user_id based access)
DROP POLICY IF EXISTS "Users can manage their own verification tokens" ON verification_tokens;
CREATE POLICY "Users can manage their own verification tokens" ON verification_tokens
    FOR ALL USING (auth.uid()::text = user_id);

-- Allow read access to currencies for all authenticated users (global data)
DROP POLICY IF EXISTS "Authenticated users can read currencies" ON currencies;
CREATE POLICY "Authenticated users can read currencies" ON currencies
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow read access to tevkifat_rates for all authenticated users (global data)
DROP POLICY IF EXISTS "Authenticated users can read tevkifat rates" ON tevkifat_rates;
CREATE POLICY "Authenticated users can read tevkifat rates" ON tevkifat_rates
    FOR SELECT USING (auth.role() = 'authenticated');

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
