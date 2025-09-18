-- Fix Employee table schema by adding missing columns
-- Migration: 0015_fix_employee_schema

-- Add missing columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_end_date DATE;

-- Add comment to track this change
COMMENT ON COLUMN employees.email IS 'Employee email address';
COMMENT ON COLUMN employees.phone IS 'Employee phone number';
COMMENT ON COLUMN employees.address IS 'Employee address';
COMMENT ON COLUMN employees.emergency_contact IS 'Emergency contact information';
COMMENT ON COLUMN employees.contract_start_date IS 'Employment contract start date';
COMMENT ON COLUMN employees.contract_end_date IS 'Employment contract end date';
