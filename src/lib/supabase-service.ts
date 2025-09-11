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
  async getTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert([{
        ...transaction,
        user_id: transaction.userId,
        category_id: transaction.categoryId,
        client_id: transaction.clientId,
        employee_id: transaction.employeeId,
        currency_id: transaction.currencyId,
        cash_account_id: transaction.cashAccountId,
        transaction_date: transaction.transactionDate,
        is_vat_included: transaction.isVatIncluded,
        vat_rate: transaction.vatRate,
        is_recurring: transaction.isRecurring,
        recurring_period: transaction.recurringPeriod,
        next_recurring_date: transaction.nextRecurringDate,
        parent_transaction_id: transaction.parentTransactionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Employees
  async getEmployees(userId: string): Promise<Employee[]> {
    const { data, error } = await this.supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  async addEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const employeeRecord = {
      // Don't include 'id' - let PostgreSQL generate UUID automatically
      name: employee.name,
      position: employee.position,
      user_id: employee.userId,
      currency_id: employee.currencyId,
      net_salary: employee.netSalary,
      payroll_period: employee.payrollPeriod,
      payment_day: employee.paymentDay,
      is_active: employee.isActive,
      email: employee.email || null,
      phone: employee.phone || null,
      address: employee.address || null,
      emergency_contact: employee.emergencyContact || null,
      contract_start_date: employee.contractStartDate ? employee.contractStartDate.toISOString() : null,
      contract_end_date: employee.contractEndDate ? employee.contractEndDate.toISOString() : null
      // Don't include created_at/updated_at - let PostgreSQL handle defaults
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
    return data || [];
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
    return data || [];
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

  // User data initialization
  async initializeUserData(userId: string) {
    try {
      const [clients, employees, transactions, categories, debts, currencies] = await Promise.all([
        this.getClients(userId),
        this.getEmployees(userId),
        this.getTransactions(userId),
        this.getCategories(userId),
        this.getDebts(userId),
        this.getCurrencies()
      ]);

      return {
        clients,
        employees, 
        transactions,
        categories,
        debts,
        currencies
      };
    } catch (error) {
      console.error('Error initializing user data:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();
