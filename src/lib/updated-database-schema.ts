// 🚀 UPDATED DATABASE SCHEMA - SNAKE_CASE FOR SUPABASE
// Bu schema yeni temiz Supabase tablolarıyla uyumlu

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

export interface Currency {
  id: string;
  code: string; // TRY, USD, EUR, GBP
  name: string;
  symbol: string; // ₺, $, €, £
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

// Legacy types for compatibility (will be removed later)
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  username?: string;
  role?: 'admin' | 'user';
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  items: QuoteItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  validUntil: Date;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface Debt {
  id: string;
  type: 'receivable' | 'payable';
  title: string;
  description: string;
  amount: number;
  clientId: string;
  currencyId: string;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bonus {
  id: string;
  employeeId: string;
  amount: number;
  description: string;
  paymentDate: Date;
  currencyId: string;
  userId: string;
  createdAt: Date;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  taxNumber: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TevkifatRate {
  id: string;
  code: string;
  numerator: number;
  denominator: number;
  description: string;
  isActive: boolean;
}

export interface CashAccount {
  id: string;
  name: string;
  balance: number;
  currencyId: string;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  items: InvoiceItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  tevkifatApplied: boolean;
  tevkifatRate?: string;
  tevkifatAmount: number;
  total: number;
  netAmountAfterTevkifat: number;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface PendingBalance {
  id: string;
  clientId: string;
  amount: number;
  description: string;
  dueDate: Date;
  status: 'pending' | 'paid';
  currencyId: string;
  userId: string;
  createdAt: Date;
}

export interface RegularPayment {
  id: string;
  name: string;
  amount: number;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextPaymentDate: Date;
  isActive: boolean;
  categoryId: string;
  currencyId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  userId: string;
  createdAt: Date;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  dueDateReminders: boolean;
  paymentReminders: boolean;
  lowBalanceAlerts: boolean;
}
