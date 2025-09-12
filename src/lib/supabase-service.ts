import { createClient } from '@/utils/supabase/client';
import type { 
  Client, 
  Employee, 
  Transaction, 
  Category, 
  Quote, 
  Debt,
  Bonus,
  CashAccount,
  Invoice,
  PendingBalance,
  RegularPayment
} from './database-schema';

export class SupabaseService {
  private supabase = createClient();

  private isUuid(value: any): boolean {
    if (!value || typeof value !== 'string') return false;
    // Basic UUID v4 regex (accepts any valid UUID format with hyphens)
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
  }

  private toUuidOrNull(value: any): string | null {
    return this.isUuid(value) ? value : null;
  }

  private toISODate(value: any): string | null {
    if (!value) return null;
    const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    if (Number.isNaN(d?.getTime?.())) return null;
    // Expecting YYYY-MM-DD for date columns
    return d.toISOString().slice(0, 10);
  }

  // Clients
  async getClients(userId: string): Promise<Client[]> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Database field'larını TypeScript interface'e map et
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      taxNumber: item.tax_number,
      contactPerson: item.contact_person,
      contractStartDate: item.contract_start_date ? new Date(item.contract_start_date) : undefined,
      contractEndDate: item.contract_end_date ? new Date(item.contract_end_date) : undefined,
      currencyId: item.currency_id,
      balance: parseFloat(item.balance) || 0,
      isActive: item.is_active,
      userId: item.user_id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  }

  async addClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const clientRecord = {
      // Don't include 'id' - let PostgreSQL generate UUID automatically
      name: client.name,
      email: client.email || null,
      phone: client.phone || null,
      address: client.address || null,
      tax_number: client.taxNumber || null,
      contact_person: client.contactPerson || null,
      contract_start_date: client.contractStartDate ? client.contractStartDate.toISOString() : null,
      contract_end_date: client.contractEndDate ? client.contractEndDate.toISOString() : null,
      user_id: client.userId,
      currency_id: client.currencyId,
      balance: client.balance || 0,
      is_active: client.isActive
      // Don't include created_at/updated_at - let PostgreSQL handle defaults
    };

    console.log('Supabase client record:', clientRecord);

    const { data, error } = await this.supabase
      .from('clients')
      .insert([clientRecord])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase client insert error:', error);
      throw error;
    }
    
    // Map response back to Client interface
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      taxNumber: data.tax_number,
      contactPerson: data.contact_person,
      contractStartDate: data.contract_start_date ? new Date(data.contract_start_date) : undefined,
      contractEndDate: data.contract_end_date ? new Date(data.contract_end_date) : undefined,
      userId: data.user_id,
      currencyId: data.currency_id,
      balance: parseFloat(data.balance) || 0,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Transactions
  // Transactions - map snake_case -> camelCase and parse dates
  async getTransactions(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      type: item.type,
      amount: Number(item.amount) || 0,
      description: item.description,
      categoryId: item.category_id || null,
      clientId: item.client_id || null,
      employeeId: item.employee_id || null,
      currencyId: item.currency_id,
      transactionDate: item.transaction_date ? new Date(item.transaction_date) : undefined,
      isVatIncluded: !!item.is_vat_included,
      vatRate: Number(item.vat_rate) || 0,
      isRecurring: !!item.is_recurring,
      recurringPeriod: item.recurring_period || null,
      nextRecurringDate: item.next_recurring_date ? new Date(item.next_recurring_date) : null,
      parentTransactionId: item.parent_transaction_id || null,
      userId: item.user_id,
      createdAt: item.created_at ? new Date(item.created_at) : undefined,
      updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
    }));
  }

  async addTransaction(transaction: any): Promise<any> {
    // ONLY fields that exist in clean database schema
    // Currency and date fallbacks will be handled below
    let transactionRecord: any = {
      type: transaction.type,
      amount: Number(transaction.amount) || 0,
      description: transaction.description || null,
      category_id: this.toUuidOrNull(transaction.categoryId || transaction.category_id),
      client_id: this.toUuidOrNull(transaction.clientId || transaction.client_id),
      employee_id: this.toUuidOrNull(transaction.employeeId || transaction.employee_id),
      currency_id: this.toUuidOrNull(transaction.currencyId || transaction.currency_id),
      transaction_date: this.toISODate(transaction.transactionDate || transaction.transaction_date) || new Date().toISOString().slice(0, 10),
      is_vat_included: !!(transaction.isVatIncluded || transaction.is_vat_included),
      vat_rate: Number(transaction.vatRate || transaction.vat_rate) || 0,
      is_recurring: !!(transaction.isRecurring || transaction.is_recurring),
      recurring_period: transaction.recurringPeriod || transaction.recurring_period || null,
      next_recurring_date: this.toISODate(transaction.nextRecurringDate || transaction.next_recurring_date),
      parent_transaction_id: this.toUuidOrNull(transaction.parentTransactionId || transaction.parent_transaction_id),
      user_id: transaction.userId || transaction.user_id
      // Removed: cash_account_id (doesn't exist in clean schema)
    };

    // If currency_id is missing/invalid, pick the first active currency as fallback
    if (!transactionRecord.currency_id) {
      const currencies = await this.getCurrencies();
      if (currencies && currencies.length > 0) {
        transactionRecord.currency_id = currencies[0].id;
      }
    }

    // Ensure user_id is a valid Supabase Auth UUID. If not, fetch current user
    if (!this.isUuid(transactionRecord.user_id)) {
      const { data } = await this.supabase.auth.getUser();
      if (data?.user?.id && this.isUuid(data.user.id)) {
        transactionRecord.user_id = data.user.id;
      } else {
        // As a last resort, set null to avoid invalid UUID error (RLS may block if required)
        transactionRecord.user_id = null;
      }
    }

    console.log('Supabase transaction record:', transactionRecord);

    const { data, error } = await this.supabase
      .from('transactions')
      .insert([transactionRecord])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase transaction insert error:', error);
      throw error;
    }
    // Map response to camelCase + Date objects immediately
    return {
      id: data.id,
      type: data.type,
      amount: Number(data.amount) || 0,
      description: data.description,
      categoryId: data.category_id || null,
      clientId: data.client_id || null,
      employeeId: data.employee_id || null,
      currencyId: data.currency_id,
      transactionDate: data.transaction_date ? new Date(data.transaction_date) : undefined,
      isVatIncluded: !!data.is_vat_included,
      vatRate: Number(data.vat_rate) || 0,
      isRecurring: !!data.is_recurring,
      recurringPeriod: data.recurring_period || null,
      nextRecurringDate: data.next_recurring_date ? new Date(data.next_recurring_date) : null,
      parentTransactionId: data.parent_transaction_id || null,
      userId: data.user_id,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }

  // Delete operations (persisted)
  async deleteClient(id: string): Promise<void> {
    const { error } = await this.supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  }

  async deleteEmployee(id: string): Promise<void> {
    // Cascade silme: regular_payments.employee_id ON DELETE CASCADE ile gider
    // Ek olarak, bu employee'a bağlı bekleyen düzenli ödemeleri manuel temizlik (gerekirse)
    const { error } = await this.supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
  }

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await this.supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  }

  // Employees - map snake_case -> camelCase
  async getEmployees(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      position: item.position,
      userId: item.user_id,
      currencyId: item.currency_id,
      netSalary: Number(item.net_salary) || 0,
      payrollPeriod: item.payroll_period,
      paymentDay: item.payment_day,
      isActive: !!item.is_active,
      email: item.email || undefined,
      phone: item.phone || undefined,
      address: item.address || undefined,
      emergencyContact: item.emergency_contact || undefined,
      contractStartDate: item.contract_start_date ? new Date(item.contract_start_date) : undefined,
      contractEndDate: item.contract_end_date ? new Date(item.contract_end_date) : undefined,
      createdAt: item.created_at ? new Date(item.created_at) : undefined,
      updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
    }));
  }

  async addEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const employeeRecord = {
      // ONLY fields that exist in clean database schema
      name: employee.name,
      position: employee.position,
      net_salary: employee.netSalary,
      currency_id: employee.currencyId,
      payroll_period: employee.payrollPeriod,
      payment_day: employee.paymentDay,
      is_active: employee.isActive !== undefined ? employee.isActive : true,
      user_id: employee.userId
      // Removed: email, phone, address, emergency_contact, contract dates (don't exist in clean schema)
    };

    console.log('Supabase employee record:', employeeRecord);

    const { data, error } = await this.supabase
      .from('employees')
      .insert([employeeRecord])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase employee insert error:', error);
      throw error;
    }
    
    // Map response back to Employee interface
    return {
      id: data.id,
      name: data.name,
      position: data.position,
      userId: data.user_id,
      currencyId: data.currency_id,
      netSalary: data.net_salary,
      payrollPeriod: data.payroll_period,
      paymentDay: data.payment_day,
      isActive: data.is_active,
      email: data.email,
      phone: data.phone,
      address: data.address,
      emergencyContact: data.emergency_contact,
      contractStartDate: data.contract_start_date ? new Date(data.contract_start_date) : undefined,
      contractEndDate: data.contract_end_date ? new Date(data.contract_end_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Categories
  async getCategories(userId: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Database field'larını TypeScript interface'e map et
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      color: item.color,
      icon: item.icon,
      isDefault: item.is_default,
      userId: item.user_id,
      createdAt: new Date(item.created_at)
    }));
  }

  // ===============================
  // Invoices
  // ===============================
  async getInvoices(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('issue_date', { ascending: false });
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      clientId: item.client_id,
      currencyId: item.currency_id,
      issueDate: item.issue_date ? new Date(item.issue_date) : undefined,
      dueDate: item.due_date ? new Date(item.due_date) : undefined,
      invoiceNumber: item.invoice_number,
      description: item.description || '',
      items: item.items || [],
      vatRate: Number(item.vat_rate) || 0,
      subtotal: Number(item.net_amount) || 0,
      total: Number(item.total_amount) || 0,
      paidAmount: Number(item.paid_amount) || 0,
      remainingAmount: Number(item.remaining_amount) || 0,
      status: item.status,
      isRecurring: !!item.is_recurring,
      recurringMonths: item.recurring_months || null,
      createdAt: item.created_at ? new Date(item.created_at) : undefined,
      updatedAt: item.updated_at ? new Date(item.updated_at) : undefined
    }));
  }

  async addInvoice(invoice: any): Promise<any> {
    const record = {
      user_id: this.isUuid(invoice.userId) ? invoice.userId : (await this.supabase.auth.getUser()).data?.user?.id,
      client_id: this.toUuidOrNull(invoice.clientId),
      // currencies.id is text in current schema
      currency_id: invoice.currencyId || null,
      issue_date: this.toISODate(invoice.issueDate) || new Date().toISOString().slice(0, 10),
      due_date: this.toISODate(invoice.dueDate) || new Date().toISOString().slice(0, 10),
      description: invoice.description || null,
      items: Array.isArray(invoice.items) ? invoice.items : null,
      invoice_number: invoice.invoiceNumber || null,
      net_amount: Number(invoice.subtotal ?? invoice.netAmount) || 0,
      vat_rate: Number(invoice.vatRate) || 0,
      total_amount: Number(invoice.total ?? invoice.totalAmount) || 0,
      paid_amount: Number(invoice.paidAmount) || 0,
      remaining_amount: Number(invoice.remainingAmount ?? ((invoice.total ?? 0) - (invoice.paidAmount ?? 0))) || 0,
      status: invoice.status || 'pending',
      is_recurring: !!invoice.isRecurring,
      recurring_months: invoice.recurringMonths || null,
    };

    // Fallback currency when not provided
    if (!record.currency_id) {
      const currencies = await this.getCurrencies().catch(() => [] as any[]);
      if (currencies && currencies.length > 0) {
        record.currency_id = currencies[0].id;
      }
    }
    const { data, error } = await this.supabase
      .from('invoices')
      .insert([record])
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      userId: data.user_id,
      clientId: data.client_id,
      currencyId: data.currency_id,
      issueDate: data.issue_date ? new Date(data.issue_date) : undefined,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      description: data.description,
      items: data.items || [],
      invoiceNumber: data.invoice_number,
      subtotal: Number(data.net_amount) || 0,
      vatRate: Number(data.vat_rate) || 0,
      total: Number(data.total_amount) || 0,
      paidAmount: Number(data.paid_amount) || 0,
      remainingAmount: Number(data.remaining_amount) || 0,
      status: data.status,
      isRecurring: !!data.is_recurring,
      recurringMonths: data.recurring_months || null,
      issueDate: new Date(data.issue_date),
      dueDate: new Date(data.due_date),
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    };
  }

  async deleteInvoice(id: string): Promise<void> {
    const { error } = await this.supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  }

  async updateInvoice(id: string, updates: any): Promise<any> {
    const record: any = {};
    if (updates.clientId !== undefined) record.client_id = this.toUuidOrNull(updates.clientId);
    if (updates.currencyId !== undefined) record.currency_id = this.toUuidOrNull(updates.currencyId);
    if (updates.issueDate !== undefined) record.issue_date = this.toISODate(updates.issueDate);
    if (updates.dueDate !== undefined) record.due_date = this.toISODate(updates.dueDate);
    if (updates.invoiceNumber !== undefined) record.invoice_number = updates.invoiceNumber;
    if (updates.netAmount !== undefined) record.net_amount = Number(updates.netAmount) || 0;
    if (updates.vatRate !== undefined) record.vat_rate = Number(updates.vatRate) || 0;
    if (updates.totalAmount !== undefined) record.total_amount = Number(updates.totalAmount) || 0;
    if (updates.status !== undefined) record.status = updates.status;
    if (updates.isRecurring !== undefined) record.is_recurring = !!updates.isRecurring;
    if (updates.recurringMonths !== undefined) record.recurring_months = updates.recurringMonths;
    record.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('invoices')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id,
      ...updates
    };
  }

  // ===============================
  // Company Settings + Logos
  // ===============================
  async getCompanySettings(userId: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      companyName: data.company_name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      taxNumber: data.tax_number,
      lightModeLogo: data.light_mode_logo_url,
      darkModeLogo: data.dark_mode_logo_url,
      quoteLogo: data.quote_logo_url,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }

  async upsertCompanySettings(userId: string, updates: any): Promise<any> {
    const record = {
      user_id: userId,
      company_name: updates.companyName,
      address: updates.address,
      phone: updates.phone,
      email: updates.email,
      website: updates.website,
      tax_number: updates.taxNumber,
      light_mode_logo_url: updates.lightModeLogo,
      dark_mode_logo_url: updates.darkModeLogo,
      quote_logo_url: updates.quoteLogo,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await this.supabase
      .from('company_settings')
      .upsert(record, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async uploadLogo(file: File, path: string): Promise<string> {
    const bucket = 'logos';
    // ensure bucket exists (ignore errors if already exists)
    try { await this.supabase.storage.createBucket(bucket, { public: true }); } catch {}
    const { error: uploadError } = await this.supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
  async addCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .insert([{
        ...category,
        user_id: category.userId,
        is_default: category.isDefault,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Debts
  async getDebts(userId: string): Promise<Debt[]> {
    const { data, error } = await this.supabase
      .from('debts')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Database field'larını TypeScript interface'e map et
    return (data || []).map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      amount: parseFloat(item.amount) || 0,
      clientId: item.client_id,
      currencyId: item.currency_id,
      dueDate: new Date(item.due_date),
      status: item.status,
      userId: item.user_id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  }

  async addDebt(debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debt> {
    const { data, error } = await this.supabase
      .from('debts')
      .insert([{
        ...debt,
        user_id: debt.userId,
        client_id: debt.clientId,
        currency_id: debt.currencyId,
        due_date: debt.dueDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Currencies (global data)
  async getCurrencies(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('currencies')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return data || [];
  }

  // Cash Accounts
  async getCashAccounts(userId: string): Promise<CashAccount[]> {
    // Cash accounts şu an store'da tutulduğu için mock data döndürüyoruz
    // İleride ayrı tablo oluşturulabilir
    return [];
  }

  // Regular Payments
  async getRegularPayments(userId: string): Promise<RegularPayment[]> {
    const { data, error } = await this.supabase
      .from('regular_payments')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      amount: parseFloat(item.amount) || 0,
      currencyId: item.currency_id,
      dueDate: new Date(item.due_date),
      frequency: item.frequency,
      category: item.category,
      status: item.status,
      description: item.description,
      employeeId: item.employee_id || null,
      userId: item.user_id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  }

  async addRegularPayment(payment: Omit<RegularPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<RegularPayment> {
    const paymentRecord = {
      title: payment.title,
      amount: payment.amount,
      currency_id: payment.currencyId,
      due_date: payment.dueDate.toISOString(),
      frequency: payment.frequency,
      category: payment.category,
      status: payment.status,
      description: payment.description || null,
      employee_id: this.toUuidOrNull((payment as any).employeeId),
      user_id: payment.userId
    };

    const { data, error } = await this.supabase
      .from('regular_payments')
      .insert([paymentRecord])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      title: data.title,
      amount: parseFloat(data.amount) || 0,
      currencyId: data.currency_id,
      dueDate: new Date(data.due_date),
      frequency: data.frequency,
      category: data.category,
      status: data.status,
      description: data.description,
      employeeId: data.employee_id || null,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Process recurring regular payments
  async processRecurringPayments(userId: string): Promise<void> {
    try {
      const today = new Date();
      const regularPayments = await this.getRegularPayments(userId);
      
      for (const payment of regularPayments) {
        // Eğer ödeme tarihi geçmişse ve pending durumundaysa
        if (payment.status === 'pending' && payment.dueDate <= today) {
          // Yeni bir transaction oluştur (gider olarak)
          await this.addTransaction({
            type: 'expense',
            amount: payment.amount,
            description: `${payment.title} - Düzenli Ödeme`,
            categoryId: null, // Varsayılan kategori
            clientId: null,
            employeeId: null,
            currencyId: payment.currencyId,
            transactionDate: payment.dueDate,
            isVatIncluded: false,
            vatRate: 0,
            isRecurring: false,
            userId: userId
          });

          // Bir sonraki ödeme tarihini hesapla
          const nextDueDate = this.calculateNextPaymentDate(payment.dueDate, payment.frequency);
          
          // Regular payment'ı güncelle
          await this.supabase
            .from('regular_payments')
            .update({ 
              due_date: nextDueDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id);
        }
      }
    } catch (error) {
      console.error('Error processing recurring payments:', error);
      throw error;
    }
  }

  // Process recurring transactions (income/expense with is_recurring)
  async processRecurringTransactions(userId: string): Promise<void> {
    try {
      const today = new Date();
      const transactions = await this.getTransactions(userId);
      const recurringParents = transactions.filter((t) => t.isRecurring && t.nextRecurringDate && t.nextRecurringDate <= today);

      for (const parent of recurringParents) {
        // Create a new child transaction occurrence
        await this.addTransaction({
          type: parent.type,
          amount: parent.amount,
          description: `${parent.description || ''} (Tekrar)`.trim(),
          categoryId: parent.categoryId,
          clientId: parent.clientId,
          employeeId: parent.employeeId,
          currencyId: parent.currencyId,
          transactionDate: parent.nextRecurringDate,
          isVatIncluded: parent.isVatIncluded,
          vatRate: parent.vatRate,
          isRecurring: false,
          parentTransactionId: parent.id,
          userId
        });

        // Calculate and set next occurrence date
        const nextDate = this.calculateNextPaymentDate(parent.nextRecurringDate!, parent.recurringPeriod || 'monthly');
        await this.supabase
          .from('transactions')
          .update({ next_recurring_date: this.toISODate(nextDate), updated_at: new Date().toISOString() })
          .eq('id', parent.id);
      }
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
      // Surface but don't throw to avoid blocking boot
    }
  }

  // Process recurring invoices
  async processRecurringInvoices(userId: string): Promise<void> {
    try {
      const invoices = await this.getInvoices(userId);
      const today = new Date();
      const parents = invoices.filter((inv) => inv.isRecurring && (inv.recurringMonths ?? 0) > 0);

      for (const parent of parents) {
        // Eğer vade/issue tarihi bugün veya geçtiyse yeni bir kopya üret
        const anchorDate = parent.dueDate || parent.issueDate || today;
        if (!anchorDate) continue;

        const shouldSpawn = anchorDate <= today;
        if (!shouldSpawn) continue;

        // Yeni fatura (aynı kalemler, tarihleri ileri al)
        const nextIssue = new Date((parent.issueDate || today).getTime());
        nextIssue.setMonth(nextIssue.getMonth() + 1);
        const nextDue = new Date((parent.dueDate || nextIssue).getTime());
        nextDue.setMonth(nextDue.getMonth() + 1);

        await this.addInvoice({
          userId,
          clientId: parent.clientId,
          currencyId: parent.currencyId,
          issueDate: nextIssue,
          dueDate: nextDue,
          description: parent.description,
          items: parent.items,
          invoiceNumber: undefined,
          subtotal: parent.subtotal,
          vatRate: parent.vatRate,
          total: parent.total,
          paidAmount: 0,
          remainingAmount: parent.total,
          status: 'pending',
          isRecurring: false,
          recurringMonths: null
        });

        // Parent'ın tekrar sayısını azalt (ay bazlı)
        const left = Math.max((parent.recurringMonths ?? 1) - 1, 0);
        await this.updateInvoice(parent.id, {
          recurringMonths: left
        });
      }
    } catch (error) {
      console.error('Error processing recurring invoices:', error);
      // Surface but don't throw
    }
  }

  private calculateNextPaymentDate(currentDate: Date, frequency: string): Date {
    const nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate;
  }

  // Create regular payments from employees (salary payments)
  async createEmployeeSalaryPayments(userId: string): Promise<void> {
    try {
      const employees = await this.getEmployees(userId);
      const existingPayments = await this.getRegularPayments(userId);
      
      for (const employee of employees) {
        if (employee.isActive && employee.netSalary > 0) {
          // Check if salary payment already exists for this employee
          const existingPayment = existingPayments.find(p => 
            p.title.includes(employee.name) && p.category === 'other'
          );
          
          if (!existingPayment) {
            // Calculate next payment date based on payroll period
            const today = new Date();
            let nextPaymentDate = new Date();
            
            switch (employee.payrollPeriod) {
              case 'weekly':
                nextPaymentDate.setDate(today.getDate() + 7);
                break;
              case 'biweekly':
                nextPaymentDate.setDate(today.getDate() + 14);
                break;
              case 'monthly':
              default:
                // Set to specific day of month
                nextPaymentDate.setDate(employee.paymentDay || 5);
                if (nextPaymentDate <= today) {
                  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
                }
                break;
            }
            
            // Create regular payment for salary
            await this.addRegularPayment({
              title: `${employee.name} - Maaş`,
              amount: employee.netSalary,
              currencyId: employee.currencyId,
              dueDate: nextPaymentDate,
              frequency: employee.payrollPeriod === 'biweekly' ? 'monthly' : employee.payrollPeriod,
              category: 'other',
              status: 'pending',
              description: `${employee.position} pozisyonundaki ${employee.name} için maaş ödemesi`,
              employeeId: employee.id,
              userId: userId
            });
          }
        }
      }
    } catch (error) {
      console.error('Error creating employee salary payments:', error);
      // Don't throw - this is not critical
    }
  }

  // User data initialization
  async initializeUserData(userId: string) {
    try {
      const [clients, employees, transactions, categories, currencies, regularPayments] = await Promise.all([
        this.getClients(userId),
        this.getEmployees(userId),
        this.getTransactions(userId),
        this.getCategories(userId),
        this.getCurrencies(),
        this.getRegularPayments(userId).catch(() => []) // Fallback to empty array if table doesn't exist
      ]);

      // Create salary payments for employees if they don't exist
      await this.createEmployeeSalaryPayments(userId);

      return {
        clients,
        employees, 
        transactions,
        categories,
        debts: [], // Empty array for now - debts will be created from regular payments
        currencies,
        regularPayments
      };
    } catch (error) {
      console.error('Error initializing user data:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();
