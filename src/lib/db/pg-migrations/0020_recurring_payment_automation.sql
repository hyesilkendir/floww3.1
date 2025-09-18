-- Recurring Payment Automation Migration
-- This migration creates the infrastructure for automatic recurring payment processing

-- 1. Add last_processed_date to regular_payments table
ALTER TABLE regular_payments 
ADD COLUMN IF NOT EXISTS last_processed_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_due_date TIMESTAMP WITH TIME ZONE;

-- 2. Create function to calculate next due date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_due_date(
    current_due_date TIMESTAMP WITH TIME ZONE,
    payment_frequency TEXT
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    CASE payment_frequency
        WHEN 'weekly' THEN
            RETURN current_due_date + INTERVAL '1 week';
        WHEN 'monthly' THEN
            RETURN current_due_date + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            RETURN current_due_date + INTERVAL '3 months';
        WHEN 'yearly' THEN
            RETURN current_due_date + INTERVAL '1 year';
        ELSE
            RETURN current_due_date + INTERVAL '1 month'; -- Default to monthly
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 3. Create function to process due recurring payments
CREATE OR REPLACE FUNCTION process_recurring_payments()
RETURNS TABLE(processed_count INTEGER, created_transactions INTEGER) AS $$
DECLARE
    payment_record RECORD;
    transaction_id UUID;
    processed_count INTEGER := 0;
    created_transactions INTEGER := 0;
BEGIN
    -- Loop through all active regular payments that are due
    FOR payment_record IN 
        SELECT * FROM regular_payments 
        WHERE is_active = true 
        AND (next_due_date IS NULL OR next_due_date <= NOW())
        AND (last_processed_date IS NULL OR last_processed_date < due_date)
    LOOP
        -- Create transaction for this payment
        INSERT INTO transactions (
            id,
            user_id,
            type,
            category,
            amount,
            description,
            date,
            currency,
            client_id,
            employee_id,
            recurring_payment_id,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            payment_record.user_id,
            'expense',
            payment_record.category,
            payment_record.amount,
            payment_record.title || ' (Otomatik)',
            payment_record.due_date,
            payment_record.currency,
            payment_record.client_id,
            payment_record.employee_id,
            payment_record.id,
            NOW(),
            NOW()
        ) RETURNING id INTO transaction_id;
        
        IF transaction_id IS NOT NULL THEN
            created_transactions := created_transactions + 1;
        END IF;
        
        -- Update the regular payment with new due date and last processed date
        UPDATE regular_payments 
        SET 
            last_processed_date = NOW(),
            next_due_date = calculate_next_due_date(due_date, frequency),
            due_date = calculate_next_due_date(due_date, frequency),
            updated_at = NOW()
        WHERE id = payment_record.id;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT processed_count, created_transactions;
END;
$$ LANGUAGE plpgsql;

-- 4. Initialize next_due_date for existing payments
UPDATE regular_payments 
SET next_due_date = calculate_next_due_date(due_date, frequency)
WHERE next_due_date IS NULL AND is_active = true;

-- 5. Add recurring_payment_id to transactions table to track auto-generated transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS recurring_payment_id UUID REFERENCES regular_payments(id) ON DELETE SET NULL;

-- 6. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_regular_payments_due_processing 
ON regular_payments(is_active, next_due_date, last_processed_date) 
WHERE is_active = true;

-- 7. Create index for recurring payment transactions
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_payment 
ON transactions(recurring_payment_id) 
WHERE recurring_payment_id IS NOT NULL;

-- 8. Add comment for documentation
COMMENT ON FUNCTION process_recurring_payments() IS 'Processes all due recurring payments and creates corresponding transactions';
COMMENT ON FUNCTION calculate_next_due_date(TIMESTAMP WITH TIME ZONE, TEXT) IS 'Calculates the next due date based on frequency';