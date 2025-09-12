-- Regular Payments table for recurring payments
CREATE TABLE IF NOT EXISTS regular_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency_id TEXT NOT NULL DEFAULT '1',
    due_date DATE NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    category TEXT NOT NULL CHECK (category IN ('loan', 'installment', 'rent', 'utilities', 'food', 'insurance', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    description TEXT,
    employee_id UUID NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE regular_payments 
ADD CONSTRAINT fk_regular_payments_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE regular_payments 
ADD CONSTRAINT fk_regular_payments_currency_id 
FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE RESTRICT;

-- Optional link to employees: cascade delete when employee removed
ALTER TABLE regular_payments
ADD CONSTRAINT fk_regular_payments_employee_id
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_regular_payments_user_id ON regular_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_regular_payments_due_date ON regular_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_regular_payments_status ON regular_payments(status);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_regular_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_regular_payments_updated_at
    BEFORE UPDATE ON regular_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_regular_payments_updated_at();
