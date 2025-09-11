// 🚀 CLEAN SUPABASE-FIRST DATABASE SCHEMA
// Uses ONLY snake_case (no field mapping needed)
// Uses ONLY auth.users (no custom users table)

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
  is_default: boolean;
  user_id: string; // References auth.users(id)
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  contact_person?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  currency_id: string;
  balance: number;
  is_active: boolean;
  user_id: string; // References auth.users(id)
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  net_salary: number;
  currency_id: string;
  payroll_period: 'monthly' | 'weekly' | 'biweekly';
  payment_day: number;
  is_active: boolean;
  user_id: string; // References auth.users(id)
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category_id?: string;
  client_id?: string;
  employee_id?: string;
  currency_id: string;
  transaction_date: string;
  is_vat_included: boolean;
  vat_rate: number;
  is_recurring: boolean;
  recurring_period?: string;
  next_recurring_date?: string;
  parent_transaction_id?: string;
  user_id: string; // References auth.users(id)
  created_at: string;
  updated_at: string;
}

// Supabase Auth User (from auth.users)
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    company_name?: string;
  };
  created_at: string;
}
