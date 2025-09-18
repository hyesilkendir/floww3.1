// 🚀 CLEAN ZUSTAND STORE - SUPABASE-FIRST APPROACH
// No custom auth, no field mapping, no UUID conversion

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { cleanSupabaseService, type Quote } from './clean-supabase-service';
import type {
  AuthUser,
  Currency,
  Category,
  Client,
  Employee,
  Transaction,
  RegularPayment,
  CashAccount
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
  regularPayments: RegularPayment[];
  quotes: Quote[]; // YENİ EKLENEN
  cashAccounts: CashAccount[]; // YENİ EKLENEN
  
  // Company Settings
  companySettings: any;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Auth Actions
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
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
  
  // Regular Payment Actions
  addRegularPayment: (payment: Omit<RegularPayment, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateRegularPayment: (id: string, updates: Partial<RegularPayment>) => Promise<void>;
  deleteRegularPayment: (id: string) => Promise<void>;
  
  // Quote Actions - YENİ EKLENEN
  addQuote: (quote: Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  
  // Cash Account Actions - YENİ EKLENEN
  addCashAccount: (cashAccount: Omit<CashAccount, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateCashAccount: (id: string, updates: Partial<CashAccount>) => Promise<void>;
  deleteCashAccount: (id: string) => Promise<void>;
  
  // Invoice Actions
  invoices: any[];
  addInvoice: (invoice: any) => Promise<void>;
  updateInvoice: (id: string, updates: any) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  markInvoiceAsPaid: (id: string, amount: number) => Promise<void>;
  
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
      currencies: [
        { id: 'TRY', code: 'TRY', name: 'Türk Lirası', symbol: '₺', is_active: true, created_at: new Date().toISOString() },
        { id: 'USD', code: 'USD', name: 'US Dollar', symbol: '$', is_active: true, created_at: new Date().toISOString() },
        { id: 'EUR', code: 'EUR', name: 'Euro', symbol: '€', is_active: true, created_at: new Date().toISOString() },
        { id: 'GBP', code: 'GBP', name: 'British Pound', symbol: '£', is_active: true, created_at: new Date().toISOString() },
      ],
      regularPayments: [],
      quotes: [], // YENİ EKLENEN
      cashAccounts: [], // YENİ EKLENEN
      invoices: [],
      companySettings: {
        id: '1',
        companyName: 'CALAF.CO',
        address: 'İstanbul, Türkiye',
        phone: '+90 212 555 0000',
        email: 'info@calaf.co',
        website: 'www.calaf.co',
        taxNumber: '',
        tevkifatRates: [
          { id: '1', code: '9/10', numerator: 9, denominator: 10, description: 'Mimarlık ve Mühendislik Hizmetleri', isActive: true },
          { id: '2', code: '7/10', numerator: 7, denominator: 10, description: 'Yazılım ve Bilişim Hizmetleri', isActive: true },
          { id: '3', code: '5/10', numerator: 5, denominator: 10, description: 'Makine ve Teçhizat Kiralanması', isActive: true },
          { id: '4', code: '3/10', numerator: 3, denominator: 10, description: 'Gayrimenkul Kiralanması', isActive: true },
          { id: '5', code: '2/10', numerator: 2, denominator: 10, description: 'Taşımacılık Hizmetleri', isActive: true },
          { id: '6', code: '1/2', numerator: 1, denominator: 2, description: 'Temizlik Hizmetleri', isActive: true },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      loading: false,
      error: null,
      
      // ==========================================
      // AUTH ACTIONS
      // ==========================================
      
      signIn: async (email: string, password: string, rememberMe: boolean = false) => {
        set({ loading: true, error: null });
        
        try {
          const { data, error } = await cleanSupabaseService.signIn(email, password, rememberMe);
          
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
          quotes: [], // YENİ EKLENEN
          cashAccounts: [], // YENİ EKLENEN
          invoices: [], // INVOICE PERSISTENCE FIX
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
        console.log('🔍 DEBUG: loadUserData başladı, user:', user);
        
        if (!user) {
          console.log('🔍 DEBUG: User bulunamadı, loadUserData sonlandırılıyor');
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          console.log('🔍 DEBUG: cleanSupabaseService.initializeUserData çağrılıyor, userId:', user.id);
          const data = await cleanSupabaseService.initializeUserData(user.id);
          console.log('🔍 DEBUG: initializeUserData sonucu:', data);
          console.log('🔍 DEBUG: clients verisi:', data.clients);
          console.log('🔍 DEBUG: clients sayısı:', data.clients?.length || 0);
          
          set({
            categories: data.categories,
            clients: data.clients,
            employees: data.employees,
            transactions: data.transactions,
            currencies: data.currencies,
            regularPayments: data.regularPayments,
            quotes: data.quotes, // YENİ EKLENEN
            cashAccounts: data.cashAccounts, // YENİ EKLENEN
            invoices: data.invoices, // INVOICE PERSISTENCE FIX
            loading: false
          });
          
          console.log('🔍 DEBUG: Store güncellendi, yeni clients:', get().clients);
        } catch (err) {
          console.error('🔍 DEBUG: Load user data error:', err);
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
      // REGULAR PAYMENT ACTIONS
      // ==========================================
      
      addRegularPayment: async (paymentData) => {
        const { user } = get();
        if (!user) {
          set({ error: 'Kullanıcı girişi gerekli' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          const newPayment = await cleanSupabaseService.addRegularPayment({
            ...paymentData,
            user_id: user.id
          });
          
          set(state => ({
            regularPayments: [...state.regularPayments, newPayment],
            loading: false
          }));
        } catch (err) {
          console.error('Add regular payment error:', err);
          set({
            error: 'Düzenli ödeme eklenirken hata oluştu',
            loading: false
          });
        }
      },
      
      updateRegularPayment: async (id, updates) => {
        set({ loading: true, error: null });
        
        try {
          const updatedPayment = await cleanSupabaseService.updateRegularPayment(id, updates);
          
          set(state => ({
            regularPayments: state.regularPayments.map(p => p.id === id ? updatedPayment : p),
            loading: false
          }));
        } catch (err) {
          console.error('Update regular payment error:', err);
          set({
            error: 'Düzenli ödeme güncellenirken hata oluştu',
            loading: false
          });
        }
      },
      
      deleteRegularPayment: async (id) => {
        set({ loading: true, error: null });
        
        try {
          await cleanSupabaseService.deleteRegularPayment(id);
          
          set(state => ({
            regularPayments: state.regularPayments.filter(p => p.id !== id),
            loading: false
          }));
        } catch (err) {
          console.error('Delete regular payment error:', err);
          set({
            error: 'Düzenli ödeme silinirken hata oluştu',
            loading: false
          });
        }
      },
      
      // ==========================================
      // QUOTE ACTIONS - YENİ EKLENEN
      // ==========================================
      
      addQuote: async (quoteData) => {
        const { user } = get();
        if (!user) {
          set({ error: 'Kullanıcı girişi gerekli' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          console.log('🔍 DEBUG: clean-store addQuote çağrıldı:', quoteData);
          
          const newQuote = await cleanSupabaseService.addQuote({
            ...quoteData,
            user_id: user.id
          });
          
          console.log('🔍 DEBUG: clean-store quote eklendi:', newQuote);
          
          set(state => ({
            quotes: [...state.quotes, newQuote],
            loading: false
          }));
        } catch (err: any) {
          console.error('🔍 DEBUG: clean-store addQuote hatası:', err);
          set({
            error: `Teklif eklenirken hata oluştu: ${err.message || err}`,
            loading: false
          });
          throw err;
        }
      },
      
      updateQuote: async (id, updates) => {
        set({ loading: true, error: null });
        
        try {
          const updatedQuote = await cleanSupabaseService.updateQuote(id, updates);
          
          set(state => ({
            quotes: state.quotes.map(q => q.id === id ? updatedQuote : q),
            loading: false
          }));
        } catch (err: any) {
          console.error('Update quote error:', err);
          set({
            error: 'Teklif güncellenirken hata oluştu',
            loading: false
          });
        }
      },
      
      deleteQuote: async (id) => {
        set({ loading: true, error: null });
        
        try {
          await cleanSupabaseService.deleteQuote(id);
          
          set(state => ({
            quotes: state.quotes.filter(q => q.id !== id),
            loading: false
          }));
        } catch (err: any) {
          console.error('Delete quote error:', err);
          set({
            error: 'Teklif silinirken hata oluştu',
            loading: false
          });
        }
      },
      
      // ==========================================
      // CASH ACCOUNT ACTIONS - YENİ EKLENEN
      // ==========================================
      
      addCashAccount: async (cashAccountData) => {
        const { user } = get();
        if (!user) {
          set({ error: 'Kullanıcı girişi gerekli' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          const newCashAccount = await cleanSupabaseService.addCashAccount({
            ...cashAccountData,
            user_id: user.id
          });
          
          set(state => ({
            cashAccounts: [...state.cashAccounts, newCashAccount],
            loading: false
          }));
        } catch (err: any) {
          console.error('Add cash account error:', err);
          set({
            error: 'Kasa eklenirken hata oluştu',
            loading: false
          });
        }
      },
      
      updateCashAccount: async (id, updates) => {
        set({ loading: true, error: null });
        
        try {
          const updatedCashAccount = await cleanSupabaseService.updateCashAccount(id, updates);
          
          set(state => ({
            cashAccounts: state.cashAccounts.map(ca => ca.id === id ? updatedCashAccount : ca),
            loading: false
          }));
        } catch (err: any) {
          console.error('Update cash account error:', err);
          set({
            error: 'Kasa güncellenirken hata oluştu',
            loading: false
          });
        }
      },
      
      deleteCashAccount: async (id) => {
        set({ loading: true, error: null });
        
        try {
          await cleanSupabaseService.deleteCashAccount(id);
          
          set(state => ({
            cashAccounts: state.cashAccounts.filter(ca => ca.id !== id),
            loading: false
          }));
        } catch (err: any) {
          console.error('Delete cash account error:', err);
          set({
            error: 'Kasa silinirken hata oluştu',
            loading: false
          });
        }
      },
      
      // ==========================================
      // UTILITY ACTIONS
      // ==========================================
      
      // ==========================================
      // INVOICE ACTIONS
      // ==========================================
      
      addInvoice: async (invoiceData) => {
        const { user } = get();
        if (!user) {
          set({ error: 'Kullanıcı girişi gerekli' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          console.log('🔍 DEBUG: clean-store addInvoice çağrıldı:', invoiceData);
          
          const newInvoice = await cleanSupabaseService.addInvoice({
            ...invoiceData,
            userId: user.id
          });
          
          console.log('🔍 DEBUG: clean-store invoice eklendi:', newInvoice);
          
          set(state => ({
            invoices: [...state.invoices, newInvoice],
            loading: false
          }));
        } catch (err: any) {
          console.error('🔍 DEBUG: clean-store addInvoice hatası:', err);
          set({
            error: `Fatura eklenirken hata oluştu: ${err.message || err}`,
            loading: false
          });
          throw err; // Frontend'e hata fırlat
        }
      },
      
      updateInvoice: async (id, updates) => {
        set({ loading: true, error: null });
        
        try {
          const updatedInvoice = await cleanSupabaseService.updateInvoice(id, updates);
          
          set(state => ({
            invoices: state.invoices.map(i => i.id === id ? updatedInvoice : i),
            loading: false
          }));
        } catch (err: any) {
          console.error('Update invoice error:', err);
          set({
            error: 'Fatura güncellenirken hata oluştu',
            loading: false
          });
        }
      },
      
      deleteInvoice: async (id) => {
        set({ loading: true, error: null });
        
        try {
          await cleanSupabaseService.deleteInvoice(id);
          
          set(state => ({
            invoices: state.invoices.filter(i => i.id !== id),
            loading: false
          }));
        } catch (err: any) {
          console.error('Delete invoice error:', err);
          set({
            error: 'Fatura silinirken hata oluştu',
            loading: false
          });
        }
      },
      
      markInvoiceAsPaid: async (id, amount) => {
        set({ loading: true, error: null });
        
        try {
          await cleanSupabaseService.updateInvoice(id, {
            status: 'paid',
            paid_amount: amount,
            remaining_amount: 0
          });
          
          set(state => ({
            invoices: state.invoices.map(i =>
              i.id === id
                ? { ...i, status: 'paid', paid_amount: amount, remaining_amount: 0 }
                : i
            ),
            loading: false
          }));
        } catch (err: any) {
          console.error('Mark invoice as paid error:', err);
          set({
            error: 'Fatura ödendi olarak işaretlenirken hata oluştu',
            loading: false
          });
        }
      },
      
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'clean-floww3-storage',
      storage: createJSONStorage(() => {
        // Remember me durumunu kontrol et
        const rememberMe = typeof window !== 'undefined' && localStorage.getItem('rememberMe') === 'true';
        return rememberMe ? localStorage : sessionStorage;
      }),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        console.log('🔍 DEBUG: Store rehydrated, state:', state);
        if (state) {
          console.log('🔍 DEBUG: Rehydrated user:', state.user);
          console.log('🔍 DEBUG: Rehydrated isAuthenticated:', state.isAuthenticated);
          
          // Store rehydrate olduktan sonra otomatik olarak getCurrentUser çağır
          setTimeout(() => {
            console.log('🔍 DEBUG: Auto-calling getCurrentUser after rehydration');
            state.getCurrentUser();
          }, 100);
        }
      },
    }
  )
);

// Store initialization - sayfa yüklendiğinde otomatik çalışır
if (typeof window !== 'undefined') {
  // Store'u initialize et
  const store = useCleanStore.getState();
  
  // Eğer persist edilmiş user varsa ama clients yoksa, data yükle
  setTimeout(() => {
    const currentState = useCleanStore.getState();
    console.log('🔍 DEBUG: Store initialization check:', {
      user: currentState.user,
      isAuthenticated: currentState.isAuthenticated,
      clientsCount: currentState.clients.length
    });
    
    if (currentState.user && currentState.isAuthenticated && currentState.clients.length === 0) {
      console.log('🔍 DEBUG: Auto-loading user data after initialization');
      currentState.loadUserData();
    }
  }, 200);
}
