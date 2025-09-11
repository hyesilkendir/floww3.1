// 🚀 CLEAN ZUSTAND STORE - SUPABASE-FIRST APPROACH
// No custom auth, no field mapping, no UUID conversion

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { cleanSupabaseService } from './clean-supabase-service';
import type { 
  AuthUser,
  Currency,
  Category, 
  Client, 
  Employee, 
  Transaction
} from './clean-database-schema';

interface CleanAppState {
  // Auth (Supabase only)
  user: AuthUser | null;
  isAuthenticated: boolean;
  
  // Data (snake_case)
  categories: Category[];
  clients: Client[];
  employees: Employee[];
  transactions: Transaction[];
  currencies: Currency[];
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Auth Actions
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  getCurrentUser: () => Promise<void>;
  
  // Data Actions
  loadUserData: () => Promise<void>;
  
  // Client Actions
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  // Employee Actions
  addEmployee: (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  // Transaction Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Utility Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCleanStore = create<CleanAppState>()(
  persist(
    (set, get) => ({
      // ==========================================
      // INITIAL STATE
      // ==========================================
      
      user: null,
      isAuthenticated: false,
      categories: [],
      clients: [],
      employees: [],
      transactions: [],
      currencies: [],
      loading: false,
      error: null,
      
      // ==========================================
      // AUTH ACTIONS
      // ==========================================
      
      signIn: async (email: string, password: string) => {
        set({ loading: true, error: null });
        
        try {
          const { data, error } = await cleanSupabaseService.signIn(email, password);
          
          if (error) {
            set({ error: 'Email veya şifre hatalı', loading: false });
            return false;
          }
          
          if (data.user) {
            set({ 
              user: data.user as AuthUser, 
              isAuthenticated: true,
              loading: false 
            });
            
            // Load user data after successful login
            await get().loadUserData();
            return true;
          }
          
          return false;
        } catch (err) {
          console.error('Sign in error:', err);
          set({ error: 'Giriş yapılırken hata oluştu', loading: false });
          return false;
        }
      },
      
      signOut: async () => {
        await cleanSupabaseService.signOut();
        set({
          user: null,
          isAuthenticated: false,
          categories: [],
          clients: [],
          employees: [],
          transactions: [],
        });
      },
      
      getCurrentUser: async () => {
        set({ loading: true });
        
        try {
          const user = await cleanSupabaseService.getCurrentUser();
          
          if (user) {
            set({ 
              user, 
              isAuthenticated: true,
              loading: false 
            });
            await get().loadUserData();
          } else {
            set({ 
              user: null, 
              isAuthenticated: false,
              loading: false 
            });
          }
        } catch (err) {
          console.error('Get user error:', err);
          set({ loading: false });
        }
      },
      
      // ==========================================
      // DATA LOADING
      // ==========================================
      
      loadUserData: async () => {
        const { user } = get();
        if (!user) return;
        
        set({ loading: true, error: null });
        
        try {
          const data = await cleanSupabaseService.initializeUserData(user.id);
          
          set({
            categories: data.categories,
            clients: data.clients,
            employees: data.employees,
            transactions: data.transactions,
            currencies: data.currencies,
            loading: false
          });
        } catch (err) {
          console.error('Load user data error:', err);
          set({ 
            error: 'Veriler yüklenirken hata oluştu',
            loading: false 
          });
        }
      },
      
      // ==========================================
      // CLIENT ACTIONS
      // ==========================================
      
      addClient: async (clientData) => {
        const { user } = get();
        if (!user) {
          set({ error: 'Kullanıcı girişi gerekli' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          const newClient = await cleanSupabaseService.addClient({
            ...clientData,
            user_id: user.id
          });
          
          set(state => ({
            clients: [...state.clients, newClient],
            loading: false
          }));
        } catch (err) {
          console.error('Add client error:', err);
          set({ 
            error: 'Cari eklenirken hata oluştu',
            loading: false 
          });
        }
      },
      
      updateClient: async (id, updates) => {
        set({ loading: true, error: null });
        
        try {
          const updatedClient = await cleanSupabaseService.updateClient(id, updates);
          
          set(state => ({
            clients: state.clients.map(c => c.id === id ? updatedClient : c),
            loading: false
          }));
        } catch (err) {
          console.error('Update client error:', err);
          set({ 
            error: 'Cari güncellenirken hata oluştu',
            loading: false 
          });
        }
      },
      
      deleteClient: async (id) => {
        set({ loading: true, error: null });
        
        try {
          await cleanSupabaseService.deleteClient(id);
          
          set(state => ({
            clients: state.clients.filter(c => c.id !== id),
            loading: false
          }));
        } catch (err) {
          console.error('Delete client error:', err);
          set({ 
            error: 'Cari silinirken hata oluştu',
            loading: false 
          });
        }
      },
      
      // ==========================================
      // EMPLOYEE ACTIONS
      // ==========================================
      
      addEmployee: async (employeeData) => {
        const { user } = get();
        if (!user) {
          set({ error: 'Kullanıcı girişi gerekli' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          const newEmployee = await cleanSupabaseService.addEmployee({
            ...employeeData,
            user_id: user.id
          });
          
          set(state => ({
            employees: [...state.employees, newEmployee],
            loading: false
          }));
        } catch (err) {
          console.error('Add employee error:', err);
          set({ 
            error: 'Personel eklenirken hata oluştu',
            loading: false 
          });
        }
      },
      
      updateEmployee: async (id, updates) => {
        set({ loading: true, error: null });
        
        try {
          const updatedEmployee = await cleanSupabaseService.updateEmployee(id, updates);
          
          set(state => ({
            employees: state.employees.map(e => e.id === id ? updatedEmployee : e),
            loading: false
          }));
        } catch (err) {
          console.error('Update employee error:', err);
          set({ 
            error: 'Personel güncellenirken hata oluştu',
            loading: false 
          });
        }
      },
      
      deleteEmployee: async (id) => {
        set({ loading: true, error: null });
        
        try {
          await cleanSupabaseService.deleteEmployee(id);
          
          set(state => ({
            employees: state.employees.filter(e => e.id !== id),
            loading: false
          }));
        } catch (err) {
          console.error('Delete employee error:', err);
          set({ 
            error: 'Personel silinirken hata oluştu',
            loading: false 
          });
        }
      },
      
      // ==========================================
      // TRANSACTION ACTIONS
      // ==========================================
      
      addTransaction: async (transactionData) => {
        const { user } = get();
        if (!user) {
          set({ error: 'Kullanıcı girişi gerekli' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          const newTransaction = await cleanSupabaseService.addTransaction({
            ...transactionData,
            user_id: user.id
          });
          
          set(state => ({
            transactions: [newTransaction, ...state.transactions],
            loading: false
          }));
        } catch (err) {
          console.error('Add transaction error:', err);
          set({ 
            error: 'İşlem eklenirken hata oluştu',
            loading: false 
          });
        }
      },
      
      updateTransaction: async (id, updates) => {
        set({ loading: true, error: null });
        
        try {
          const updatedTransaction = await cleanSupabaseService.updateTransaction(id, updates);
          
          set(state => ({
            transactions: state.transactions.map(t => t.id === id ? updatedTransaction : t),
            loading: false
          }));
        } catch (err) {
          console.error('Update transaction error:', err);
          set({ 
            error: 'İşlem güncellenirken hata oluştu',
            loading: false 
          });
        }
      },
      
      deleteTransaction: async (id) => {
        set({ loading: true, error: null });
        
        try {
          await cleanSupabaseService.deleteTransaction(id);
          
          set(state => ({
            transactions: state.transactions.filter(t => t.id !== id),
            loading: false
          }));
        } catch (err) {
          console.error('Delete transaction error:', err);
          set({ 
            error: 'İşlem silinirken hata oluştu',
            loading: false 
          });
        }
      },
      
      // ==========================================
      // UTILITY ACTIONS
      // ==========================================
      
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'clean-floww3-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
