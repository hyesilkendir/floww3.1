-- Add Cash Accounts Table Migration
-- This migration creates the cash_accounts table for managing cash accounts

-- 1. Create cash_accounts table
CREATE TABLE IF NOT EXISTS cash_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    currency_id TEXT NOT NULL DEFAULT 'TRY',
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT cash_accounts_name_user_unique UNIQUE(user_id, name),
    CONSTRAINT cash_accounts_balance_check CHECK (balance >= 0)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_accounts_user_id ON cash_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_accounts_is_active ON cash_accounts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cash_accounts_is_default ON cash_accounts(user_id, is_default) WHERE is_default = true;

-- 3. Enable RLS (Row Level Security)
ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own cash accounts" ON cash_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cash accounts" ON cash_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash accounts" ON cash_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash accounts" ON cash_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_cash_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cash_accounts_updated_at
    BEFORE UPDATE ON cash_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_cash_accounts_updated_at();

-- 6. Add foreign key reference to currencies table if it exists
-- Note: This assumes currencies table exists with id as TEXT
ALTER TABLE cash_accounts
ADD CONSTRAINT fk_cash_accounts_currency
FOREIGN KEY (currency_id) REFERENCES currencies(id);

-- 7. Add comments for documentation
COMMENT ON TABLE cash_accounts IS 'Cash accounts for managing different cash balances';
COMMENT ON COLUMN cash_accounts.user_id IS 'Reference to the user who owns this cash account';
COMMENT ON COLUMN cash_accounts.name IS 'Name of the cash account (e.g., "Ana Kasa", "Dolar Kasası")';
COMMENT ON COLUMN cash_accounts.currency_id IS 'Currency ID for this cash account';
COMMENT ON COLUMN cash_accounts.balance IS 'Current balance of the cash account';
COMMENT ON COLUMN cash_accounts.is_default IS 'Whether this is the default cash account for the user';
COMMENT ON COLUMN cash_accounts.is_active IS 'Whether this cash account is active';

-- 8. Create function to ensure only one default cash account per user
CREATE OR REPLACE FUNCTION ensure_single_default_cash_account()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this account as default, unset all other defaults for this user
    IF NEW.is_default = true THEN
        UPDATE cash_accounts 
        SET is_default = false, updated_at = NOW()
        WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_cash_account
    BEFORE INSERT OR UPDATE ON cash_accounts
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_cash_account();

-- 9. Insert default cash account for existing users (optional)
-- This will create a default TRY cash account for users who don't have any
-- INSERT INTO cash_accounts (user_id, name, currency_id, balance, is_default, is_active)
-- SELECT 
--     id as user_id,
--     'Ana Kasa' as name,
--     '1' as currency_id,
--     0.00 as balance,
--     true as is_default,
--     true as is_active
-- FROM auth.users 
-- WHERE id NOT IN (SELECT DISTINCT user_id FROM cash_accounts);