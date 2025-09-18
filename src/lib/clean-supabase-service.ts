// 🚀 CLEAN SUPABASE SERVICE - NO FIELD MAPPING NEEDED
// Uses snake_case directly, auth.users only

import { createClient } from '@/utils/supabase/client';
import type { 
  Currency,
  Category, 
  Client, 
  Employee,
  Transaction,
  RegularPayment,
  AuthUser,
  CashAccount
} from './clean-database-schema';

// Quote interface for clean service
export interface Quote {
  id: string;
  user_id: string;
  client_id: string;
  currency_id: string;
  issue_date: string;
  valid_until: string;
  description?: string;
  items?: any;
  quote_number: string;
  net_amount: number;
  vat_rate: number;
  total_amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'converted';
  withholding_tax_rate?: number;
  withholding_tax_amount?: number;
  converted_to_invoice_id?: string;
  created_at: string;
  updated_at: string;
}

export class CleanSupabaseService {
  private supabase = createClient();

  // ==========================================
  // AUTH METHODS
  // ==========================================
  
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error || !user) return null;
    return user as AuthUser;
  }

  async signIn(email: string, password: string, rememberMe: boolean = false) {
    // Remember me durumuna göre session storage type belirlenir
    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
    }
    
    return await this.supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  // ==========================================
  // CURRENCIES (Public)
  // ==========================================
  
  async getCurrencies(): Promise<Currency[]> {
    const { data, error } = await this.supabase
      .from('currencies')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return data || [];
  }

  // ==========================================
  // CATEGORIES (Per User)
  // ==========================================
  
  async getCategories(userId: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  async addCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .insert([category])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ==========================================
  // CLIENTS (Per User)
  // ==========================================
  
  async getClients(userId: string): Promise<Client[]> {
    console.log('🔍 DEBUG: getClients çağrıldı, userId:', userId);
    
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId);
    
    console.log('🔍 DEBUG: Supabase clients sorgusu sonucu:', { data, error });
    console.log('🔍 DEBUG: Clients sayısı:', data?.length || 0);
    
    if (error) {
      console.error('🔍 DEBUG: getClients hatası:', error);
      throw error;
    }
    return data || [];
  }

  async addClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const { data, error } = await this.supabase
      .from('clients')
      .insert([client])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await this.supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteClient(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ==========================================
  // EMPLOYEES (Per User)
  // ==========================================
  
  async getEmployees(userId: string): Promise<Employee[]> {
    const { data, error } = await this.supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  async addEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    const { data, error } = await this.supabase
      .from('employees')
      .insert([employee])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const { data, error } = await this.supabase
      .from('employees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteEmployee(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ==========================================
  // TRANSACTIONS (Per User)
  // ==========================================
  
  async getTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await this.supabase
      .from('transactions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ==========================================
  // QUOTES (Per User) - YENİ EKLENEN
  // ==========================================
  
  async getQuotes(userId: string): Promise<Quote[]> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async addQuote(quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'>): Promise<Quote> {
    console.log('🔍 DEBUG: clean-supabase-service addQuote çağrıldı:', quote);
    
    const { data, error } = await this.supabase
      .from('quotes')
      .insert([{
        ...quote,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('🔍 DEBUG: Supabase quotes insert hatası:', error);
      throw error;
    }
    
    console.log('🔍 DEBUG: Supabase quotes insert başarılı:', data);
    return data;
  }

  async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote> {
    const { data, error } = await this.supabase
      .from('quotes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteQuote(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('quotes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ==========================================
  // INVOICES (Per User)
  // ==========================================
  
  async getInvoices(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Raw data'yı frontend formatına dönüştür
    return (data || []).map(invoice => ({
      id: invoice.id,
      clientId: invoice.client_id,
      currencyId: invoice.currency_id,
      issueDate: new Date(invoice.issue_date),
      dueDate: new Date(invoice.due_date),
      description: invoice.description,
      items: JSON.parse(invoice.items || '[]'),
      invoiceNumber: invoice.invoice_number,
      subtotal: invoice.net_amount,
      vatRate: invoice.vat_rate,
      total: invoice.total_amount,
      paidAmount: invoice.paid_amount,
      remainingAmount: invoice.remaining_amount,
      status: invoice.status,
      isRecurring: invoice.is_recurring,
      recurringMonths: invoice.recurring_months,
      tevkifatAmount: invoice.withholding_tax_amount,
      tevkifatApplied: invoice.withholding_tax_amount > 0,
      tevkifatRate: invoice.withholding_tax_rate > 0 ? `${Math.round(invoice.withholding_tax_rate * 10)}/10` : undefined,
      userId: invoice.user_id,
      createdAt: new Date(invoice.created_at),
      updatedAt: new Date(invoice.updated_at)
    }));
  }

  async addInvoice(invoice: any): Promise<any> {
    console.log('🔍 DEBUG: clean-supabase-service addInvoice çağrıldı:', invoice);
    
    // Frontend formatından Supabase formatına dönüştür
    const dbRecord = {
      user_id: invoice.userId,
      client_id: invoice.clientId,
      currency_id: invoice.currencyId,
      issue_date: invoice.issueDate instanceof Date ? invoice.issueDate.toISOString().split('T')[0] : invoice.issueDate,
      due_date: invoice.dueDate instanceof Date ? invoice.dueDate.toISOString().split('T')[0] : invoice.dueDate,
      description: invoice.description,
      items: JSON.stringify(invoice.items || []),
      invoice_number: invoice.invoiceNumber,
      net_amount: invoice.subtotal || 0,
      vat_rate: invoice.vatRate || 0,
      total_amount: invoice.total || 0,
      paid_amount: invoice.paidAmount || 0,
      remaining_amount: invoice.remainingAmount || invoice.total || 0,
      status: invoice.status === 'draft' ? 'pending' : (invoice.status || 'pending'), // draft -> pending dönüşümü
      is_recurring: invoice.isRecurring || false,
      recurring_months: invoice.recurringMonths || null,
      withholding_tax_rate: invoice.tevkifatApplied ?
        (parseFloat(invoice.tevkifatRate?.split('/')[0] || '0') / parseFloat(invoice.tevkifatRate?.split('/')[1] || '1') * 100) : 0,
      withholding_tax_amount: invoice.tevkifatAmount || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 DEBUG: dbRecord hazırlandı:', dbRecord);
    
    const { data, error } = await this.supabase
      .from('invoices')
      .insert([dbRecord])
      .select()
      .single();
    
    if (error) {
      console.error('🔍 DEBUG: Supabase insert hatası:', error);
      console.error('🔍 DEBUG: Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('🔍 DEBUG: Supabase insert başarılı:', data);
    
    // 🔥 RECURRING INVOICE LOGIC - Eğer recurring fatura ise recurring payment oluştur
    if (data.is_recurring && data.recurring_months > 0) {
      console.log('🔁 DEBUG: Recurring invoice algılandı, recurring payments oluşturuluyor...');
      
      try {
        // Recurring invoice'lar için regular_payments tablosuna kayıt ekle
        const recurringPaymentData = {
          user_id: data.user_id,
          client_id: data.client_id,
          title: `Tekrarlayan Fatura: ${data.description || data.invoice_number}`,
          amount: data.total_amount,
          currency_id: data.currency_id,
          due_date: data.due_date,
          frequency: 'monthly',
          category: 'invoice_recurring',
          is_active: true,
          remaining_occurrences: data.recurring_months,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: recurringData, error: recurringError } = await this.supabase
          .from('regular_payments')
          .insert([recurringPaymentData])
          .select()
          .single();
        
        if (recurringError) {
          console.error('🔍 DEBUG: Recurring payment oluşturma hatası:', recurringError);
        } else {
          console.log('🔁 DEBUG: Recurring payment başarıyla oluşturuldu:', recurringData);
        }
      } catch (recurringErr) {
        console.error('🔍 DEBUG: Recurring logic hatası:', recurringErr);
        // Recurring payment hatası ana işlemi engellemesin
      }
    }
    
    // Supabase formatından frontend formatına dönüştür
    const frontendFormat = {
      id: data.id,
      clientId: data.client_id,
      currencyId: data.currency_id,
      issueDate: new Date(data.issue_date),
      dueDate: new Date(data.due_date),
      description: data.description,
      items: JSON.parse(data.items || '[]'),
      invoiceNumber: data.invoice_number,
      subtotal: data.net_amount,
      vatRate: data.vat_rate,
      total: data.total_amount,
      paidAmount: data.paid_amount,
      remainingAmount: data.remaining_amount,
      status: data.status,
      isRecurring: data.is_recurring,
      recurringMonths: data.recurring_months,
      tevkifatAmount: data.withholding_tax_amount,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
    
    return frontendFormat;
  }

  async updateInvoice(id: string, updates: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('invoices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Raw data'yı frontend formatına dönüştür
    return {
      id: data.id,
      clientId: data.client_id,
      currencyId: data.currency_id,
      issueDate: new Date(data.issue_date),
      dueDate: new Date(data.due_date),
      description: data.description,
      items: JSON.parse(data.items || '[]'),
      invoiceNumber: data.invoice_number,
      subtotal: data.net_amount,
      vatRate: data.vat_rate,
      total: data.total_amount,
      paidAmount: data.paid_amount,
      remainingAmount: data.remaining_amount,
      status: data.status,
      isRecurring: data.is_recurring,
      recurringMonths: data.recurring_months,
      tevkifatAmount: data.withholding_tax_amount,
      tevkifatApplied: data.withholding_tax_amount > 0,
      tevkifatRate: data.withholding_tax_rate > 0 ? `${Math.round(data.withholding_tax_rate * 10)}/10` : undefined,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async deleteInvoice(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ==========================================
  // REGULAR PAYMENTS (Per User)
  // ==========================================
  
  async getRegularPayments(userId: string): Promise<RegularPayment[]> {
    const { data, error } = await this.supabase
      .from('regular_payments')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async addRegularPayment(payment: Omit<RegularPayment, 'id' | 'created_at' | 'updated_at'>): Promise<RegularPayment> {
    const { data, error } = await this.supabase
      .from('regular_payments')
      .insert([payment])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateRegularPayment(id: string, updates: Partial<RegularPayment>): Promise<RegularPayment> {
    const { data, error } = await this.supabase
      .from('regular_payments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteRegularPayment(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('regular_payments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ==========================================
  // CASH ACCOUNTS (Per User) - YENİ EKLENEN
  // ==========================================
  
  async getCashAccounts(userId: string): Promise<CashAccount[]> {
    const { data, error } = await this.supabase
      .from('cash_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async addCashAccount(cashAccount: Omit<CashAccount, 'id' | 'created_at' | 'updated_at'>): Promise<CashAccount> {
    const { data, error } = await this.supabase
      .from('cash_accounts')
      .insert([{
        ...cashAccount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateCashAccount(id: string, updates: Partial<CashAccount>): Promise<CashAccount> {
    const { data, error } = await this.supabase
      .from('cash_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteCashAccount(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('cash_accounts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ==========================================
  // RECURRING PAYMENT PROCESSING
  // ==========================================

  async processRecurringPayments(): Promise<{ processed_count: number; created_transactions: number }> {
    const { data, error } = await this.supabase.rpc('process_recurring_payments');
    
    if (error) {
      console.error('Process recurring payments error:', error);
      throw new Error(`Failed to process recurring payments: ${error.message}`);
    }
    
    return data?.[0] || { processed_count: 0, created_transactions: 0 };
  }

  // 🔥 YENİ: Manual recurring invoice processing
  async processRecurringInvoices(): Promise<void> {
    const { error } = await this.supabase.rpc('process_recurring_invoices');
    
    if (error) {
      console.error('Process recurring invoices error:', error);
      throw new Error(`Failed to process recurring invoices: ${error.message}`);
    }
    
    console.log('🔁 DEBUG: Recurring invoices processed successfully');
  }

  // 🔥 YENİ: Recurring invoice ve payment'ları birlikte işle
  async processAllRecurringItems(): Promise<{ invoices_processed: boolean; payments_result: any }> {
    try {
      // Önce recurring invoices'ları işle
      await this.processRecurringInvoices();
      
      // Sonra recurring payments'ları işle
      const paymentsResult = await this.processRecurringPayments();
      
      return {
        invoices_processed: true,
        payments_result: paymentsResult
      };
    } catch (error) {
      console.error('Process all recurring items error:', error);
      throw error;
    }
  }

  async getDueRegularPayments(): Promise<RegularPayment[]> {
    const { data, error } = await this.supabase
      .from('regular_payments')
      .select('*')
      .eq('is_active', true)
      .or('next_due_date.is.null,next_due_date.lte.now()')
      .or('last_processed_date.is.null,last_processed_date.lt.due_date');
    
    if (error) {
      console.error('Get due regular payments error:', error);
      throw new Error(`Failed to fetch due regular payments: ${error.message}`);
    }
    
    return data || [];
  }

  // ==========================================
  // BULK DATA INITIALIZATION
  // ==========================================
  
  async initializeUserData(userId: string) {
    try {
      console.log('🔍 DEBUG: initializeUserData başladı, userId:', userId);
      
      const [categories, clients, employees, transactions, currencies, regularPayments, quotes, cashAccounts, invoices] = await Promise.all([
        this.getCategories(userId),
        this.getClients(userId),
        this.getEmployees(userId),
        this.getTransactions(userId),
        this.getCurrencies(),
        this.getRegularPayments(userId),
        this.getQuotes(userId), // YENİ EKLENEN
        this.getCashAccounts(userId), // YENİ EKLENEN
        this.getInvoices(userId) // INVOICE PERSISTENCE FIX
      ]);

      console.log('🔍 DEBUG: initializeUserData tamamlandı:', {
        categories: categories?.length || 0,
        clients: clients?.length || 0,
        employees: employees?.length || 0,
        transactions: transactions?.length || 0,
        currencies: currencies?.length || 0,
        regularPayments: regularPayments?.length || 0,
        quotes: quotes?.length || 0,
        cashAccounts: cashAccounts?.length || 0,
        invoices: invoices?.length || 0
      });

      return {
        categories,
        clients,
        employees,
        transactions,
        currencies,
        regularPayments,
        quotes, // YENİ EKLENEN
        cashAccounts, // YENİ EKLENEN
        invoices // INVOICE PERSISTENCE FIX
      };
    } catch (error) {
      console.error('🔍 DEBUG: initializeUserData hatası:', error);
      throw error;
    }
  }
}

export const cleanSupabaseService = new CleanSupabaseService();
