import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabaseService } from './supabase-service';
import { createClient } from '@/utils/supabase/client';

// NO AUTH MAPPING NEEDED - Use auth.users directly
import type { 
  User, 
  Client, 
  Employee, 
  Transaction, 
  Category, 
  Currency, 
  Quote, 
  Debt,
  Bonus,
  CompanySettings,
  TevkifatRate,
  CashAccount,
  Invoice,
  InvoiceItem,
  PendingBalance,
  RegularPayment,
  AppNotification,
  NotificationPreferences
} from './database-schema';

interface AppState {
  // Kullanıcı durumu
  isAuthenticated: boolean;
  user: User | null;
  users: User[];
  
  // Veriler
  clients: Client[];
  employees: Employee[];
  transactions: Transaction[];
  categories: Category[];
  currencies: Currency[];
  quotes: Quote[];
  debts: Debt[];
  bonuses: Bonus[];
  cashAccounts: CashAccount[];
  invoices: Invoice[];
  pendingBalances: PendingBalance[];
  regularPayments: RegularPayment[];
  notifications: AppNotification[];
  notificationPrefs: NotificationPreferences;
  
  // Ayarlar
  companySettings: CompanySettings | null;
  
  // UI durumu
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  showAmounts: boolean; // Rakamları gizleme/gösterme
  
  // Error handling
  error: string | null;
  loading: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: { email: string; password: string; name: string }) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  setAuth: (user: User) => void;
  logout: () => void;
  loadUserData: (userId: string) => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
  setSidebarOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // User management
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // Company settings
  updateCompanySettings: (data: Partial<CompanySettings>) => Promise<void>;
  
  // Tevkifat rates
  addTevkifatRate: (rate: Omit<TevkifatRate, 'id'>) => Promise<void>;
  updateTevkifatRate: (id: string, data: Partial<TevkifatRate>) => Promise<void>;
  deleteTevkifatRate: (id: string) => Promise<void>;
  
  // Data actions
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  addBonus: (bonus: Omit<Bonus, 'id' | 'createdAt'>) => Promise<void>;
  deleteBonus: (id: string) => Promise<void>;
  
  // Cash account actions
  addCashAccount: (cashAccount: Omit<CashAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCashAccount: (id: string, cashAccount: Partial<CashAccount>) => Promise<void>;
  deleteCashAccount: (id: string) => Promise<void>;
  
    // Invoice actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  markInvoiceAsPaid: (id: string, paidAmount: number, paymentDate?: Date) => Promise<void>;
  generateRecurringInvoices: (parentInvoiceId: string) => Promise<void>;

  // Pending balance actions
  addPendingBalance: (balance: Omit<PendingBalance, 'id' | 'createdAt'>) => Promise<void>;
  markPendingBalanceAsPaid: (id: string) => Promise<void>;
  deletePendingBalance: (id: string) => Promise<void>;

  // Regular payments actions
  addRegularPayment: (payment: Omit<RegularPayment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRegularPayment: (id: string, payment: Partial<RegularPayment>) => Promise<void>;
  deleteRegularPayment: (id: string) => Promise<void>;

  // Notifications
  generateNotifications: () => void;
  deleteNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotificationPrefs: (prefs: Partial<NotificationPreferences>) => void;

  // Helper functions
  getClientBalance: (clientId: string, currencyId?: string) => number;
  getClientPendingBalance: (clientId: string, currencyId?: string) => number;
  getTotalPendingBalances: () => number;
  processPaymentFromTransaction: (transactionId: string) => Promise<void>;
  
  // UI actions
  toggleShowAmounts: () => void;
  
  // Demo data loader
  initDemoData: () => Promise<void>;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const getBonusTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    bonus: 'Prim',
    advance: 'Avans',
    overtime: 'Mesai',
    commission: 'Komisyon',
  };
  return labels[type] || type;
};

const defaultCurrencies: Currency[] = [
  { id: '1', code: 'TRY', name: 'Türk Lirası', symbol: '₺', isActive: true },
  { id: '2', code: 'USD', name: 'US Dollar', symbol: '$', isActive: true },
  { id: '3', code: 'EUR', name: 'Euro', symbol: '€', isActive: true },
  { id: '4', code: 'GBP', name: 'British Pound', symbol: '£', isActive: true },
];

const defaultCategories: Category[] = [
  { id: '1', name: 'Ofis Giderleri', type: 'expense', color: '#ef4444', isDefault: true, userId: '1', createdAt: new Date() },
  { id: '2', name: 'Pazarlama', type: 'expense', color: '#f97316', isDefault: true, userId: '1', createdAt: new Date() },
  { id: '3', name: 'Teknoloji', type: 'expense', color: '#8b5cf6', isDefault: true, userId: '1', createdAt: new Date() },
  { id: '4', name: 'Maaş Ödemeleri', type: 'expense', color: '#06b6d4', isDefault: true, userId: '1', createdAt: new Date() },
  { id: '5', name: 'Müşteri Ödemeleri', type: 'income', color: '#22c55e', isDefault: true, userId: '1', createdAt: new Date() },
  { id: '6', name: 'Diğer Gelirler', type: 'income', color: '#84cc16', isDefault: true, userId: '1', createdAt: new Date() },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      users: [],
      clients: [],
      employees: [],
      transactions: [],
      categories: defaultCategories,
      currencies: defaultCurrencies,
      quotes: [],
      debts: [],
      bonuses: [],
      cashAccounts: [],
      invoices: [],
      pendingBalances: [],
      regularPayments: [],
      notifications: [],
      notificationPrefs: {
        enableNotifications: true,
        enableSound: true,
        enableNative: false,
      },
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
      theme: 'light',
      sidebarOpen: true,
      showAmounts: false, // Varsayılan olarak gizli
      error: null,
      loading: false,
      
      // Auth actions
      login: async (username, password) => {
        get().setLoading(true);
        try {
          // 1. ÖNCE: Store'dan tüm kullanıcıları kontrol et (güncellenmiş şifreler dahil)
          const allUsers = get().users;
          const userFromStore = allUsers.find(u => 
            (u.email === username || (username === 'admin' && u.email === 'admin@calaf.co')) 
            && u.password === password
          );
          
          if (userFromStore) {
            set({ user: userFromStore, isAuthenticated: true });
            return true;
          }

          // 2. SONRA: Mevcut session user'ı kontrol et
          const currentUser = get().user;
          if (currentUser && (username === currentUser.email || username === 'admin') && password === currentUser.password) {
            set({ user: currentUser, isAuthenticated: true });
            return true;
          }

          // 3. EN SON: Default admin kontrolü (sadece hiç kullanıcı yoksa)
          if ((username === 'admin' || username === 'admin@calaf.co') && password === '532d7315' && allUsers.length === 0) {
            const demoUser: User = {
              id: 'admin-user-1',
              email: 'admin@calaf.co',
              password: '532d7315',
              name: 'Admin User',
              companyName: 'CALAF.CO',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            // İlk kez giriş yapıyorsa, users array'ine de ekle
            set({ 
              user: demoUser, 
              isAuthenticated: true,
              users: [demoUser]
            });
            return true;
          }

          get().setError('Kullanıcı adı veya şifre hatalı.');
          return false;
        } catch (err) {
          get().setError('Giriş yapılırken bir hata oluştu.');
          return false;
        } finally {
          get().setLoading(false);
        }
      },
      register: async (userData) => {
        get().setLoading(true);
        try {
          // Check if user already exists
          const existingUser = get().users.find(u => u.email === userData.email);
          if (existingUser) {
            get().setError('Bu e-posta adresi zaten kullanımda.');
            return false;
          }

          // Create new user with default company
          const newUser: User = {
            id: generateId(),
            email: userData.email,
            password: userData.password, // In a real app, hash this
            name: userData.name,
            companyName: 'CALAF.CO', // Default company
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          set((state) => ({ users: [...state.users, newUser] }));
          set({ user: newUser, isAuthenticated: true });
          return true;
        } catch (err) {
          get().setError('Kayıt olurken bir hata oluştu.');
          return false;
        } finally {
          get().setLoading(false);
        }
      },
      changePassword: async (currentPassword: string, newPassword: string) => {
        get().setLoading(true);
        try {
          const currentUser = get().user;
          if (!currentUser) {
            get().setError('Kullanıcı girişi yapılmamış.');
            return false;
          }

          // Mevcut şifreyi kontrol et
          if (currentUser.password !== currentPassword) {
            get().setError('Mevcut şifre yanlış.');
            return false;
          }

          // Şifre güçlülük kontrolü
          if (newPassword.length < 6) {
            get().setError('Yeni şifre en az 6 karakter olmalıdır.');
            return false;
          }

          // Şifreyi güncelle
          const updatedUser: User = {
            ...currentUser,
            password: newPassword,
            updatedAt: new Date(),
          };

          // Store'daki kullanıcıyı güncelle - ÖNCE users array'ini güncelle
          set((state) => ({
            user: updatedUser,
            users: state.users.length > 0 
              ? state.users.map(u => u.id === currentUser.id ? updatedUser : u)
              : [updatedUser] // Eğer users array boşsa, kullanıcıyı ekle
          }));

          // localStorage'ı hemen güncelle
          const currentState = get();
          const storageData = {
            user: updatedUser,
            users: currentState.users,
            isAuthenticated: currentState.isAuthenticated,
            clients: currentState.clients,
            employees: currentState.employees,
            transactions: currentState.transactions,
            categories: currentState.categories,
            quotes: currentState.quotes,
            debts: currentState.debts,
            bonuses: currentState.bonuses,
            cashAccounts: currentState.cashAccounts,
            invoices: currentState.invoices,
            pendingBalances: currentState.pendingBalances,
        regularPayments: currentState.regularPayments,
        notifications: currentState.notifications,
        notificationPrefs: currentState.notificationPrefs,
            companySettings: currentState.companySettings,
            theme: currentState.theme,
            showAmounts: currentState.showAmounts,
            error: currentState.error,
            loading: currentState.loading,
          };
          
          localStorage.setItem('calaf-storage', JSON.stringify({ state: storageData, version: 0 }));

          get().setError(null);
          
          // Şifre değişikliği sonrası otomatik logout
          setTimeout(() => {
            get().logout();
          }, 1000);
          
          return true;
        } catch (err) {
          get().setError('Şifre değiştirirken bir hata oluştu.');
          return false;
        } finally {
          get().setLoading(false);
        }
      },
      setAuth: (user) => set({ isAuthenticated: true, user }),
      logout: async () => {
        // Supabase'den çıkış yap
        const supabase = createClient();
        await supabase.auth.signOut();
        
        // SADECE AUTH BİLGİLERİNİ TEMİZLE - data'yı koru
        set({ 
          isAuthenticated: false, 
          user: null
          // Data arrays'leri temizleme - database'de zaten mevcut
        });
      },
      
      loadUserData: async (userId: string) => {
        try {
          set({ loading: true });
          
          console.log('📊 Loading data for user:', userId);
          
          // Supabase'den kullanıcı verilerini yükle (NO MAPPING)
          const data = await supabaseService.initializeUserData(userId);
          const [invoices, settings] = await Promise.all([
            supabaseService.getInvoices(userId).catch(() => []),
            supabaseService.getCompanySettings(userId).catch(() => null)
          ]);
          
          set({
            clients: data.clients,
            employees: data.employees,
            transactions: data.transactions,
            categories: data.categories.length > 0 ? data.categories : defaultCategories,
            debts: data.debts,
            currencies: data.currencies.length > 0 ? data.currencies : defaultCurrencies,
            regularPayments: data.regularPayments || [],
            invoices: invoices as any,
            companySettings: (settings as any) || get().companySettings,
            loading: false
          });
          
        } catch (error) {
          console.error('Error loading user data:', error);
          set({ 
            error: 'Veriler yüklenirken hata oluştu',
            loading: false 
          });
        }
      },
      
      // User management
      addUser: async (userData) => {
        try {
          const newUser: User = {
            ...userData,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set((state) => ({ users: [...state.users, newUser] }));
        } catch (err) {
          get().setError('Failed to add user.');
        }
      },
      updateUser: async (id, data) => {
        try {
          set((state) => ({
            users: state.users.map((user) =>
              user.id === id ? { ...user, ...data, updatedAt: new Date() } : user
            ),
            user: state.user?.id === id ? { ...state.user, ...data, updatedAt: new Date() } : state.user,
          }));
        } catch (err) {
          get().setError('Failed to update user.');
        }
      },
      deleteUser: async (id) => {
        try {
          set((state) => ({
            users: state.users.filter((user) => user.id !== id),
          }));
        } catch (err) {
          get().setError('Failed to delete user.');
        }
      },

      // Company settings
      updateCompanySettings: async (data) => {
        try {
          set((state) => ({
            companySettings: state.companySettings
              ? { ...state.companySettings, ...data, updatedAt: new Date() }
              : null,
          }));
        } catch (err) {
          get().setError('Failed to update company settings.');
        }
      },

      // Tevkifat rates
      addTevkifatRate: async (rateData) => {
        try {
          const newRate: TevkifatRate = {
            ...rateData,
            id: Date.now().toString(),
          };
          set((state) => ({
            companySettings: state.companySettings
              ? {
                  ...state.companySettings,
                  tevkifatRates: [...(state.companySettings.tevkifatRates || []), newRate],
                  updatedAt: new Date(),
                }
              : null,
          }));
        } catch (err) {
          get().setError('Failed to add tevkifat rate.');
        }
      },
      updateTevkifatRate: async (id, data) => {
        try {
          set((state) => ({
            companySettings: state.companySettings
              ? {
                  ...state.companySettings,
                  tevkifatRates: state.companySettings.tevkifatRates?.map((rate) =>
                    rate.id === id ? { ...rate, ...data } : rate
                  ) || [],
                  updatedAt: new Date(),
                }
              : null,
          }));
        } catch (err) {
          get().setError('Failed to update tevkifat rate.');
        }
      },
      deleteTevkifatRate: async (id) => {
        try {
          set((state) => ({
            companySettings: state.companySettings
              ? {
                  ...state.companySettings,
                  tevkifatRates: state.companySettings.tevkifatRates?.filter((rate) => rate.id !== id) || [],
                  updatedAt: new Date(),
                }
              : null,
          }));
        } catch (err) {
          get().setError('Failed to delete tevkifat rate.');
        }
      },
      
      // UI actions
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ loading }),
      
      // Client actions
      addClient: async (clientData) => {
        try {
          console.log('Adding client:', clientData);
          
          // Loading state başlat
          set({ loading: true, error: null });
          
          // Önce aynı isimde client var mı kontrol et
          const existingClient = get().clients.find(c => 
            c.name.toLowerCase() === clientData.name.toLowerCase() && 
            c.userId === clientData.userId
          );
          
          if (existingClient) {
            console.warn('Client already exists:', existingClient.name);
            set({ loading: false });
            return;
          }
          
          console.log('💾 Saving client with userId:', clientData.userId);
          
          // Supabase'e kaydet (NO MAPPING)
          const savedClient = await supabaseService.addClient(clientData);
          console.log('Client saved to Supabase:', savedClient);
          
          // Local state'e ekle
          set((state) => ({ 
            clients: [...state.clients, savedClient],
            loading: false 
          }));
          console.log('Client added to local state');
        } catch (err) {
          console.error('Error adding client:', err);
          set({ loading: false });
          
          // Specific error handling
          if (err.code === '23505') {
            get().setError('Bu isimde bir cari zaten mevcut.');
          } else if (err.code === 'PGRST116') {
            get().setError('Veritabanı bağlantı hatası. Lütfen tekrar deneyin.');
          } else {
            get().setError(`Cari eklenirken hata oluştu: ${err.message || err}`);
          }
        }
      },
      
      updateClient: async (id, updates) => {
        try {
          set((state) => ({
            clients: state.clients.map((client) =>
              client.id === id ? { ...client, ...updates, updatedAt: new Date() } : client
            ),
          }));
        } catch (err) {
          get().setError('Failed to update client.');
        }
      },
      
      deleteClient: async (id) => {
        try {
          await supabaseService.deleteClient(id);
          set((state) => ({
            clients: state.clients.filter((client) => client.id !== id),
          }));
        } catch (err) {
          console.error('Delete client error:', err);
          get().setError('Failed to delete client.');
        }
      },
      
      // Employee actions
      addEmployee: async (employeeData) => {
        try {
          const user = get().user;
          if (!user) {
            get().setError('Kullanıcı girişi gerekli.');
            return;
          }

          console.log('Adding employee:', employeeData);
          
          // Loading state başlat
          set({ loading: true, error: null });
          
          // Aynı isimde employee var mı kontrol et
          const existingEmployee = get().employees.find(e => 
            e.name.toLowerCase() === employeeData.name.toLowerCase() && 
            e.userId === employeeData.userId
          );
          
          if (existingEmployee) {
            console.warn('Employee already exists:', existingEmployee.name);
            set({ loading: false });
            return;
          }
          
          console.log('💾 Saving employee with userId:', employeeData.userId);
          
          // Supabase'e kaydet (NO MAPPING)
          const savedEmployee = await supabaseService.addEmployee(employeeData);
          console.log('Employee saved to Supabase:', savedEmployee);
          
          // Local state'e ekle
          set((state) => ({ 
            employees: [...state.employees, savedEmployee],
            loading: false 
          }));
          console.log('Employee added to local state');
        } catch (err) {
          console.error('Error adding employee:', err);
          set({ loading: false });
          
          // Specific error handling
          if (err.code === '23505') {
            get().setError('Bu isimde bir personel zaten mevcut.');
          } else if (err.code === 'PGRST116') {
            get().setError('Veritabanı bağlantı hatası. Lütfen tekrar deneyin.');
          } else {
            get().setError(`Personel eklenirken hata oluştu: ${err.message || err}`);
          }
        }
      },
      
      updateEmployee: async (id, updates) => {
        try {
          set((state) => ({
            employees: state.employees.map((employee) =>
              employee.id === id ? { ...employee, ...updates, updatedAt: new Date() } : employee
            ),
          }));
        } catch (err) {
          get().setError('Failed to update employee.');
        }
      },
      
      deleteEmployee: async (id) => {
        try {
          await supabaseService.deleteEmployee(id);
          set((state) => ({
            employees: state.employees.filter((employee) => employee.id !== id),
          }));
        } catch (err) {
          console.error('Delete employee error:', err);
          get().setError('Failed to delete employee.');
        }
      },
      
      // Transaction actions
      addTransaction: async (transactionData) => {
        try {
          console.log('💾 Saving transaction with userId:', transactionData.userId);
          
          // Önce Supabase'e kaydet (NO MAPPING)
          const savedTransaction = await supabaseService.addTransaction(transactionData);
          
          // Sonra local state'e ekle
          set((state) => ({ transactions: [...state.transactions, savedTransaction] }));
          
          // Eğer gelir transaction'ı ise ve fatura ile ilişkiliyse otomatik ödeme kontrolü yap
          if (savedTransaction.type === 'income' && savedTransaction.clientId && savedTransaction.description.includes('Fatura:')) {
            await get().processPaymentFromTransaction(savedTransaction.id);
          }
        } catch (err) {
          console.error('Error adding transaction:', err);
          get().setError('Transaction eklenirken hata oluştu.');
        }
      },
      
      updateTransaction: async (id, updates) => {
        try {
          set((state) => ({
            transactions: state.transactions.map((transaction) =>
              transaction.id === id ? { ...transaction, ...updates, updatedAt: new Date() } : transaction
            ),
          }));
        } catch (err) {
          get().setError('Failed to update transaction.');
        }
      },
      
      deleteTransaction: async (id) => {
        try {
          await supabaseService.deleteTransaction(id);
          set((state) => ({
            transactions: state.transactions.filter((transaction) => transaction.id !== id),
          }));
        } catch (err) {
          console.error('Delete transaction error:', err);
          get().setError('Failed to delete transaction.');
        }
      },
      
      // Category actions
      addCategory: async (categoryData) => {
        try {
          const category: Category = {
            ...categoryData,
            id: generateId(),
            createdAt: new Date(),
          };
          set((state) => ({ categories: [...state.categories, category] }));
        } catch (err) {
          get().setError('Failed to add category.');
        }
      },
      
      updateCategory: async (id, updates) => {
        try {
          set((state) => ({
            categories: state.categories.map((category) =>
              category.id === id ? { ...category, ...updates } : category
            ),
          }));
        } catch (err) {
          get().setError('Failed to update category.');
        }
      },
      
      deleteCategory: async (id) => {
        try {
          set((state) => ({
            categories: state.categories.filter((category) => category.id !== id),
          }));
        } catch (err) {
          get().setError('Failed to delete category.');
        }
      },
      
      // Quote actions
      addQuote: async (quoteData) => {
        try {
          const quote: Quote = {
            ...quoteData,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set((state) => ({ quotes: [...state.quotes, quote] }));
        } catch (err) {
          get().setError('Failed to add quote.');
        }
      },
      
      updateQuote: async (id, updates) => {
        try {
          set((state) => ({
            quotes: state.quotes.map((quote) =>
              quote.id === id ? { ...quote, ...updates, updatedAt: new Date() } : quote
            ),
          }));
        } catch (err) {
          get().setError('Failed to update quote.');
        }
      },
      
      deleteQuote: async (id) => {
        try {
          set((state) => ({
            quotes: state.quotes.filter((quote) => quote.id !== id),
          }));
        } catch (err) {
          get().setError('Failed to delete quote.');
        }
      },
      
      // Debt actions
      addDebt: async (debtData) => {
        try {
          const debt: Debt = {
            ...debtData,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set((state) => ({ debts: [...state.debts, debt] }));
        } catch (err) {
          get().setError('Failed to add debt.');
        }
      },
      
      updateDebt: async (id, updates) => {
        try {
          set((state) => ({
            debts: state.debts.map((debt) =>
              debt.id === id ? { ...debt, ...updates, updatedAt: new Date() } : debt
            ),
          }));
        } catch (err) {
          get().setError('Failed to update debt.');
        }
      },
      
      deleteDebt: async (id) => {
        try {
          set((state) => ({
            debts: state.debts.filter((debt) => debt.id !== id),
          }));
        } catch (err) {
          get().setError('Failed to delete debt.');
        }
      },
      
      // Bonus actions
      addBonus: async (bonusData) => {
        try {
          const bonus: Bonus = {
            ...bonusData,
            id: generateId(),
            createdAt: new Date(),
          };
          
          // Sadece bonus'u ekle (transaction oluşturma)
          set((state) => ({ bonuses: [...state.bonuses, bonus] }));
        } catch (err) {
          get().setError('Failed to add bonus.');
        }
      },
      
      deleteBonus: async (bonusId: string) => {
        try {
          set((state) => ({ 
            bonuses: state.bonuses.filter(b => b.id !== bonusId) 
          }));
        } catch (err) {
          get().setError('Failed to delete bonus.');
        }
      },
      
      // Cash account actions
      addCashAccount: async (cashAccountData) => {
        try {
          const cashAccount: CashAccount = {
            ...cashAccountData,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set((state) => ({ cashAccounts: [...state.cashAccounts, cashAccount] }));
        } catch (err) {
          get().setError('Failed to add cash account.');
        }
      },
      
      updateCashAccount: async (id, updates) => {
        try {
          set((state) => ({
            cashAccounts: state.cashAccounts.map((account) =>
              account.id === id ? { ...account, ...updates, updatedAt: new Date() } : account
            ),
          }));
        } catch (err) {
          get().setError('Failed to update cash account.');
        }
      },
      
      deleteCashAccount: async (id) => {
        try {
          set((state) => ({
            cashAccounts: state.cashAccounts.filter((account) => account.id !== id),
          }));
        } catch (err) {
          get().setError('Failed to delete cash account.');
        }
      },
      
      // Invoice actions
      addInvoice: async (invoiceData) => {
        try {
          const user = get().user;
          if (!user) return;
          const saved = await supabaseService.addInvoice({ ...invoiceData, userId: user.id });
          set((state) => ({ invoices: [...state.invoices, saved] }));
        } catch (err) {
          console.error('Failed to add invoice:', err);
          get().setError('Failed to add invoice.');
        }
      },
      
      updateInvoice: async (id, updates) => {
        try {
          const updated = await supabaseService.updateInvoice(id, updates);
          set((state) => ({
            invoices: state.invoices.map((invoice) =>
              invoice.id === id ? { ...invoice, ...updates, ...updated } : invoice
            ),
          }));
        } catch (err) {
          console.error('Failed to update invoice:', err);
          get().setError('Failed to update invoice.');
        }
      },
      
      deleteInvoice: async (id) => {
        try {
          await supabaseService.deleteInvoice(id);
          set((state) => ({
            invoices: state.invoices.filter((invoice: Invoice) => invoice.id !== id),
            pendingBalances: state.pendingBalances.filter((pb: PendingBalance) => pb.invoiceId !== id)
          }));
        } catch (err) {
          console.error('Failed to delete invoice:', err);
          get().setError('Failed to delete invoice.');
        }
      },
      
      markInvoiceAsPaid: async (id: string, paidAmount: number, paymentDate: Date = new Date()) => {
        try {
          const invoice = get().invoices.find((inv: Invoice) => inv.id === id);
          if (!invoice) return;
          
          // Ödeme transaction'ı oluştur
          const paymentTransaction = {
            type: 'income' as const,
            amount: paidAmount,
            currencyId: invoice.currencyId,
            categoryId: '5', // Müşteri Ödemeleri kategorisi
            clientId: invoice.clientId,
            description: `Fatura: ${invoice.invoiceNumber} - ${invoice.description} ödemesi`,
            transactionDate: paymentDate,
            isVatIncluded: true,
            vatRate: invoice.vatRate,
            isRecurring: false,
            userId: invoice.userId,
          };
          
          // Transaction'ı ekle
          await get().addTransaction(paymentTransaction);
          
          set((state) => {
            const updatedInvoices = state.invoices.map((invoice) => {
              if (invoice.id === id) {
                const newPaidAmount = invoice.paidAmount + paidAmount;
                const newRemainingAmount = invoice.netAmountAfterTevkifat - newPaidAmount;
                
                return {
                  ...invoice,
                  paidAmount: newPaidAmount,
                  remainingAmount: newRemainingAmount,
                  status: newRemainingAmount <= 0 ? 'paid' as const : invoice.status,
                  paymentDate: newRemainingAmount <= 0 ? paymentDate : invoice.paymentDate,
                  updatedAt: new Date(),
                };
              }
              return invoice;
            });
            
            // İlgili bekleyen bakiyeyi güncelle veya sil
            const updatedPendingBalances = state.pendingBalances.map((pb) => {
              if (pb.invoiceId === id) {
                const invoice = updatedInvoices.find(inv => inv.id === id);
                if (invoice && invoice.status === 'paid') {
                  return { ...pb, status: 'paid' as const };
                }
                return { ...pb, amount: invoice?.remainingAmount || pb.amount };
              }
              return pb;
            });
            
            return {
              invoices: updatedInvoices,
              pendingBalances: updatedPendingBalances
            };
          });
        } catch (err) {
          get().setError('Failed to mark invoice as paid.');
        }
      },
      
      generateRecurringInvoices: async (parentInvoiceId) => {
        try {
          const parentInvoice = get().invoices.find(inv => inv.id === parentInvoiceId);
          if (!parentInvoice || !parentInvoice.isRecurring || !parentInvoice.recurringMonths) {
            return;
          }
          
          const newInvoices: Invoice[] = [];
          const newPendingBalances: PendingBalance[] = [];
          
          for (let i = 1; i < parentInvoice.recurringMonths; i++) {
            // Oluşturulma tarihine göre hesapla
            const nextIssueDate = new Date(parentInvoice.issueDate);
            const nextDueDate = new Date(parentInvoice.dueDate);
            
            if (parentInvoice.recurringPeriod === 'monthly') {
              nextIssueDate.setMonth(nextIssueDate.getMonth() + i);
              nextDueDate.setMonth(nextDueDate.getMonth() + i);
            } else if (parentInvoice.recurringPeriod === 'quarterly') {
              nextIssueDate.setMonth(nextIssueDate.getMonth() + (i * 3));
              nextDueDate.setMonth(nextDueDate.getMonth() + (i * 3));
            } else if (parentInvoice.recurringPeriod === 'yearly') {
              nextIssueDate.setFullYear(nextIssueDate.getFullYear() + i);
              nextDueDate.setFullYear(nextDueDate.getFullYear() + i);
            }
            
            const recurringInvoice: Invoice = {
              ...parentInvoice,
              id: generateId(),
              invoiceNumber: `${parentInvoice.invoiceNumber}-${i + 1}`,
              issueDate: nextIssueDate,
              dueDate: nextDueDate,
              parentInvoiceId: parentInvoiceId,
              recurringIndex: i + 1,
              status: 'draft' as const,
              paidAmount: 0,
              remainingAmount: parentInvoice.netAmountAfterTevkifat, // Tevkifat sonrası tutar
              paymentDate: undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            newInvoices.push(recurringInvoice);
            
            // Her tekrarlanan fatura için bekleyen bakiye oluştur
            newPendingBalances.push({
              id: generateId(),
              clientId: recurringInvoice.clientId,
              invoiceId: recurringInvoice.id,
              amount: recurringInvoice.netAmountAfterTevkifat, // Tevkifat sonrası tutar
              dueDate: recurringInvoice.dueDate,
              description: `Fatura: ${recurringInvoice.invoiceNumber}`,
              status: 'pending' as const,
              createdAt: new Date(),
            });
          }
          
          // Invoice'ları ve pending balance'ları ekle
          set((state) => ({
            invoices: [...state.invoices, ...newInvoices],
            pendingBalances: [...state.pendingBalances, ...newPendingBalances]
          }));
        } catch (err) {
          get().setError('Failed to generate recurring invoices.');
        }
      },
      
      // Pending balance actions
      addPendingBalance: async (balanceData) => {
        try {
          const balance: PendingBalance = {
            ...balanceData,
            id: generateId(),
            createdAt: new Date(),
          };
          set((state) => ({ pendingBalances: [...state.pendingBalances, balance] }));
        } catch (err) {
          get().setError('Failed to add pending balance.');
        }
      },
      
      markPendingBalanceAsPaid: async (id) => {
        try {
          set((state) => ({
            pendingBalances: state.pendingBalances.map((balance) =>
              balance.id === id ? { ...balance, status: 'paid' as const } : balance
            ),
          }));
        } catch (err) {
          get().setError('Failed to mark pending balance as paid.');
        }
      },
      
      deletePendingBalance: async (id) => {
        try {
          set((state) => ({
            pendingBalances: state.pendingBalances.filter((balance) => balance.id !== id),
          }));
        } catch (err) {
          get().setError('Failed to delete pending balance.');
        }
      },

      // Regular payments actions
      addRegularPayment: async (paymentData) => {
        try {
          set({ loading: true, error: null });
          const user = get().user;
          if (!user) throw new Error('Kullanıcı girişi gerekli.');
          
          const newPayment = await supabaseService.addRegularPayment({
            ...paymentData,
            userId: user.id
          });
          
          set((state) => ({ 
            regularPayments: [...state.regularPayments, newPayment],
            loading: false
          }));
        } catch (err) {
          console.error('Failed to add regular payment:', err);
          set({ loading: false, error: `Düzenli ödeme eklenirken hata oluştu: ${err.message || err}` });
        }
      },
      updateRegularPayment: async (id, updates) => {
        try {
          set((state) => ({
            regularPayments: state.regularPayments.map((p) =>
              p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
            ),
          }));
        } catch (err) {
          get().setError('Failed to update regular payment.');
        }
      },
      deleteRegularPayment: async (id) => {
        try {
          set((state) => ({
            regularPayments: state.regularPayments.filter((p) => p.id !== id),
          }));
        } catch (err) {
          get().setError('Failed to delete regular payment.');
        }
      },

      // Notifications
      generateNotifications: () => {
        try {
          if (!get().notificationPrefs.enableNotifications) return;
          const notifications: AppNotification[] = [];
          const today = new Date();
          const next7 = new Date();
          next7.setDate(today.getDate() + 7);

          // 1) 1 hafta içinde yaklaşan alacaklar (debts: receivable & pending)
          get().debts
            .filter(d => d.type === 'receivable' && d.status === 'pending')
            .filter(d => d.dueDate >= today && d.dueDate <= next7)
            .forEach(d => {
              notifications.push({
                id: `receivable_${d.id}`,
                type: 'receivable_due',
                title: `Yaklaşan Alacak: ${d.title}`,
                description: `Vade ${d.dueDate.toLocaleDateString('tr-TR')} - Tutar: ${d.amount.toLocaleString('tr-TR')} TL` ,
                link: '/debts',
                date: d.dueDate,
                createdAt: new Date(),
              });
            });

          // 2) 1 hafta içinde yaklaşan ödemeler (debts: payable & pending)
          get().debts
            .filter(d => d.type === 'payable' && d.status === 'pending')
            .filter(d => d.dueDate >= today && d.dueDate <= next7)
            .forEach(d => {
              notifications.push({
                id: `payable_${d.id}`,
                type: 'payable_due',
                title: `Yaklaşan Ödeme: ${d.title}`,
                description: `Vade ${d.dueDate.toLocaleDateString('tr-TR')} - Tutar: ${d.amount.toLocaleString('tr-TR')} TL` ,
                link: '/debts',
                date: d.dueDate,
                createdAt: new Date(),
              });
            });

          // 3) Düzenli ödemeler: bir sonraki occurrence 1 hafta içinde ise uyar
          const addInterval = (date: Date, freq: string) => {
            const d = new Date(date);
            if (freq === 'weekly') d.setDate(d.getDate() + 7);
            else if (freq === 'quarterly') d.setMonth(d.getMonth() + 3);
            else if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1);
            else d.setMonth(d.getMonth() + 1); // monthly default
            return d;
          };
          get().regularPayments
            .filter(rp => rp.status === 'pending')
            .forEach(rp => {
              // rp.dueDate'i bugünün önüne taşı, sonra ilk 7 gün içindeyse bildirim oluştur
              let occ = new Date(rp.dueDate);
              while (occ < today) {
                const next = addInterval(occ, rp.frequency);
                if (next.getTime() === occ.getTime()) break;
                occ = next;
              }
              if (occ >= today && occ <= next7) {
                notifications.push({
                  id: `regular_${rp.id}_${occ.toISOString().slice(0,10)}`,
                  type: 'regular_payment_due',
                  title: `Yaklaşan Düzenli Ödeme: ${rp.title}`,
                  description: `Vade ${occ.toLocaleDateString('tr-TR')} - Tutar: ${rp.amount.toLocaleString('tr-TR')} TL` ,
                  link: '/regular-payments',
                  date: occ,
                  createdAt: new Date(),
                });
              }
            });

          // 4) Teklifler: 1 hafta içinde son tarihi yaklaşan ya da 7+ gündür 'sent' durumda olanlar
          get().quotes
            .filter(q => q.status === 'sent')
            .forEach(q => {
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(today.getDate() - 7);
              const shouldNotify = (q.validUntil >= today && q.validUntil <= next7) || (q.updatedAt <= sevenDaysAgo);
              if (shouldNotify) {
                const ndate = q.validUntil >= today ? q.validUntil : today;
                notifications.push({
                  id: `quote_${q.id}_${ndate.toISOString().slice(0,10)}`,
                  type: 'quote_followup',
                  title: `Teklif Takibi: ${q.title}`,
                  description: `Durum: Yanıt bekleniyor. ${q.validUntil ? 'Son tarih ' + q.validUntil.toLocaleDateString('tr-TR') : ''}` ,
                  link: '/quotes',
                  date: ndate,
                  createdAt: new Date(),
                });
              }
            });

          // Var olanlarla birleştir (aynı id'li olanları güncelleme yerine koru)
          const existing = get().notifications;
          const map = new Map<string, AppNotification>();
          [...existing, ...notifications].forEach(n => {
            if (!map.has(n.id)) map.set(n.id, { ...n, read: existing.find(e => e.id === n.id)?.read ?? false });
          });

          set({ notifications: Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime()) });
        } catch (err) {
          get().setError('Failed to generate notifications.');
        }
      },
      deleteNotification: (id: string) => {
        set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) }));
      },
      markNotificationAsRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
        }));
      },
      clearAllNotifications: () => {
        set({ notifications: [] });
      },
      updateNotificationPrefs: (prefs) => {
        set((state) => ({ notificationPrefs: { ...state.notificationPrefs, ...prefs } }));
      },
      
      // UI actions
      toggleShowAmounts: () => {
        set((state) => ({ showAmounts: !state.showAmounts }));
      },
      
      // Helper functions
      getClientBalance: (clientId: string, currencyId?: string) => {
        const clientTransactions = get().transactions.filter((t: Transaction) => t.clientId === clientId);
        
        if (currencyId) {
          // Belirli para birimi için bakiye
          return clientTransactions
            .filter((t: Transaction) => t.currencyId === currencyId)
            .reduce((balance: number, transaction: Transaction) => {
              if (transaction.type === 'income') {
                return balance + transaction.amount;
              } else {
                return balance - transaction.amount;
              }
            }, 0);
        } else {
          // Tüm para birimlerini TRY'ye çevirerek hesapla (şimdilik 1:1 oranında)
          return clientTransactions.reduce((balance: number, transaction: Transaction) => {
            if (transaction.type === 'income') {
              return balance + transaction.amount;
            } else {
              return balance - transaction.amount;
            }
          }, 0);
        }
      },
      
      getClientPendingBalance: (clientId: string, currencyId?: string) => {
        return get().pendingBalances
          .filter((pb: PendingBalance) => pb.clientId === clientId && pb.status === 'pending')
          .filter((pb: PendingBalance) => {
            if (!currencyId) return true;
            const invoice = get().invoices.find((inv: Invoice) => inv.id === pb.invoiceId);
            return invoice?.currencyId === currencyId;
          })
          .reduce((sum: number, pb: PendingBalance) => sum + pb.amount, 0);
      },
      
      getTotalPendingBalances: () => {
        return get().pendingBalances
          .filter((pb: PendingBalance) => pb.status === 'pending')
          .reduce((sum: number, pb: PendingBalance) => sum + pb.amount, 0);
      },
      
      processPaymentFromTransaction: async (transactionId: string) => {
        try {
          const transaction = get().transactions.find((t: Transaction) => t.id === transactionId);
          if (!transaction || transaction.type !== 'income') return;
          
          // Eğer bu transaction zaten bir ödeme transaction'ıysa (description'da "ödemesi" geçiyorsa) işlem yapma
          if (transaction.description.includes('ödemesi')) return;
          
          // Transaction açıklamasından fatura numarasını çıkar
          const invoiceNumberMatch = transaction.description.match(/Fatura:\s*([^\s-]+)/);
          if (!invoiceNumberMatch) return;
          
          const invoiceNumber = invoiceNumberMatch[1];
          const invoice = get().invoices.find((inv: Invoice) => inv.invoiceNumber === invoiceNumber);
          if (!invoice) return;
          
          // Bu faturayla ilişkili bekleyen bakiye var mı kontrol et
          const pendingBalance = get().pendingBalances.find((pb: PendingBalance) => 
            pb.invoiceId === invoice.id && pb.status === 'pending'
          );
          
          if (pendingBalance && transaction.amount >= pendingBalance.amount) {
            // Faturayı ödendi olarak işaretle (ama yeni transaction oluşturma)
            set((state) => {
              const updatedInvoices = state.invoices.map((inv) => {
                if (inv.id === invoice.id) {
                  return {
                    ...inv,
                    paidAmount: inv.paidAmount + pendingBalance.amount,
                    remainingAmount: inv.netAmountAfterTevkifat - (inv.paidAmount + pendingBalance.amount),
                    status: 'paid' as const,
                    paymentDate: new Date(),
                    updatedAt: new Date(),
                  };
                }
                return inv;
              });
              
              const updatedPendingBalances = state.pendingBalances.map((pb) => {
                if (pb.invoiceId === invoice.id) {
                  return { ...pb, status: 'paid' as const };
                }
                return pb;
              });
              
              return {
                invoices: updatedInvoices,
                pendingBalances: updatedPendingBalances
              };
            });
          }
        } catch (err) {
          console.error('Payment processing failed:', err);
        }
      },
      
      // Demo data
      initDemoData: async () => {
        try {
          const demoUser: User = {
            id: '1',
            email: 'admin@calaf.co',
            password: '123456',
            name: 'Calaf.co Admin',
            companyName: 'Calaf.co Reklam Ajansı',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          set({
            user: demoUser,
            isAuthenticated: true,
          });
        } catch (err) {
          get().setError('Failed to initialize demo data.');
        }
      },
    }),
    {
      name: 'calaf-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        users: state.users,
        isAuthenticated: state.isAuthenticated,
        clients: state.clients,
        employees: state.employees,
        transactions: state.transactions,
        categories: state.categories,
        quotes: state.quotes,
        debts: state.debts,
        bonuses: state.bonuses,
        cashAccounts: state.cashAccounts,
        invoices: state.invoices,
        pendingBalances: state.pendingBalances,
        regularPayments: state.regularPayments,
        notifications: state.notifications,
        notificationPrefs: state.notificationPrefs,
        companySettings: state.companySettings,
        theme: state.theme,
        showAmounts: state.showAmounts,
        error: state.error,
        loading: state.loading,
      }),
    }
  )
);