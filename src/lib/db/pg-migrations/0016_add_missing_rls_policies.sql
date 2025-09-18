-- Add missing RLS policies for invoices, company_settings, and regular_payments
-- Migration: 0016_add_missing_rls_policies

-- Enable RLS and add policies for invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own invoices" ON invoices
  FOR ALL USING (auth.uid() = user_id);

-- Enable RLS and add policies for company_settings table
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own company settings" ON company_settings
  FOR ALL USING (auth.uid() = user_id);

-- Enable RLS and add policies for regular_payments table
ALTER TABLE regular_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own regular payments" ON regular_payments
  FOR ALL USING (auth.uid() = user_id);

-- Add indexes for better performance on RLS queries
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_user_id ON company_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_regular_payments_user_id_status ON regular_payments(user_id, status);
