-- Add missing fields to employees table

ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_start_date TIMESTAMP;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_end_date TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS employees_email_idx ON employees (email);
CREATE INDEX IF NOT EXISTS employees_phone_idx ON employees (phone);
CREATE INDEX IF NOT EXISTS employees_contract_start_date_idx ON employees (contract_start_date);
CREATE INDEX IF NOT EXISTS employees_contract_end_date_idx ON employees (contract_end_date);
