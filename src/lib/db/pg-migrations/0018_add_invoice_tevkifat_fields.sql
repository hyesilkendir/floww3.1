-- Migration: Add tevkifat and missing fields to invoices table
-- Date: 2025-12-09
-- Description: Adds tevkifat (withholding tax) fields and other missing columns to invoices table

-- Add missing columns to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tevkifat_applied BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tevkifat_rate TEXT,
ADD COLUMN IF NOT EXISTS tevkifat_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount_after_tevkifat NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS parent_invoice_id UUID REFERENCES invoices(id),
ADD COLUMN IF NOT EXISTS recurring_index INTEGER,
ADD COLUMN IF NOT EXISTS recurring_period TEXT,
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add constraint for recurring_period
ALTER TABLE invoices 
ADD CONSTRAINT IF NOT EXISTS check_recurring_period 
CHECK (recurring_period IS NULL OR recurring_period IN ('monthly', 'quarterly', 'yearly'));

-- Update existing invoices to have proper subtotal and vat_amount values
UPDATE invoices 
SET 
  subtotal = COALESCE(net_amount, 0),
  vat_amount = COALESCE(total_amount, 0) - COALESCE(net_amount, 0),
  net_amount_after_tevkifat = COALESCE(total_amount, 0)
WHERE subtotal IS NULL OR subtotal = 0;

-- Add index for parent_invoice_id for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_parent_invoice_id ON invoices(parent_invoice_id);

-- Add index for recurring queries
CREATE INDEX IF NOT EXISTS idx_invoices_recurring ON invoices(is_recurring, recurring_period) WHERE is_recurring = true;

-- Update RLS policies to include new fields
-- (The existing policies should cover the new fields automatically)

COMMENT ON COLUMN invoices.subtotal IS 'Subtotal amount before VAT';
COMMENT ON COLUMN invoices.vat_amount IS 'VAT amount calculated';
COMMENT ON COLUMN invoices.tevkifat_applied IS 'Whether withholding tax is applied';
COMMENT ON COLUMN invoices.tevkifat_rate IS 'Withholding tax rate (e.g., 7/10)';
COMMENT ON COLUMN invoices.tevkifat_amount IS 'Withholding tax amount';
COMMENT ON COLUMN invoices.net_amount_after_tevkifat IS 'Net amount after withholding tax deduction';
COMMENT ON COLUMN invoices.parent_invoice_id IS 'Parent invoice ID for recurring invoices';
COMMENT ON COLUMN invoices.recurring_index IS 'Index number for recurring invoices (1, 2, 3...)';
COMMENT ON COLUMN invoices.recurring_period IS 'Period for recurring invoices';
COMMENT ON COLUMN invoices.payment_date IS 'Date when invoice was paid';
COMMENT ON COLUMN invoices.notes IS 'Additional notes for the invoice';
