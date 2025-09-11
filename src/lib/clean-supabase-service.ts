// 🚀 CLEAN SUPABASE SERVICE - NO FIELD MAPPING NEEDED
// Uses snake_case directly, auth.users only

import { createClient } from '@/utils/supabase/client';
import type { 
  Currency,
  Category, 
  Client, 
  Employee, 
  Transaction,
  AuthUser
} from './clean-database-schema';

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

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
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
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
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
  // BULK DATA INITIALIZATION
  // ==========================================
  
  async initializeUserData(userId: string) {
    try {
      const [categories, clients, employees, transactions, currencies] = await Promise.all([
        this.getCategories(userId),
        this.getClients(userId),
        this.getEmployees(userId), 
        this.getTransactions(userId),
        this.getCurrencies()
      ]);

      return {
        categories,
        clients,
        employees,
        transactions,
        currencies
      };
    } catch (error) {
      console.error('Error initializing user data:', error);
      throw error;
    }
  }
}

export const cleanSupabaseService = new CleanSupabaseService();
