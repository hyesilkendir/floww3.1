'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthLayout } from '@/components/layout/auth-layout';
import { useAppStore } from '@/lib/store';
import { createDemoData } from '@/lib/demo-data';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  ChevronDown,
  Wallet,
  Plus,
  AlertTriangle,
  FileText,
  Calendar,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isAfter, isBefore, addDays, subDays, addMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AnalizPage() {
  // Auth states
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Form states - HOOK RULES: EN ÜSTTE OLMALI
  const [quickTransactionData, setQuickTransactionData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
    categoryId: '',
    clientId: '',
    cashAccountId: ''
  });

  const [quickClientData, setQuickClientData] = useState({
    name: '',
    email: '',
    phone: '',
    currencyId: '1'
  });

  const [isQuickTransactionOpen, setIsQuickTransactionOpen] = useState(false);
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [selectedCashAccountId, setSelectedCashAccountId] = useState('');
  const [chartDateRange, setChartDateRange] = useState('last_30');

  // Store data - Hook'lardan sonra
  const { 
    transactions, 
    clients, 
    employees, 
    debts, 
    bonuses,
    currencies, 
    cashAccounts,
    categories,
    invoices,
    pendingBalances,
    regularPayments,
    showAmounts,
    toggleShowAmounts,
    addTransaction,
    addClient,
    addQuote,
    addCashAccount,
    getTotalPendingBalances,
    loadUserData,
    setAuth
  } = useAppStore();

  // Auth kontrolü ve veri yükleme
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        setAuth({
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || '',
          password: '',
          name: user.user_metadata?.name || user.email || '',
          companyName: user.user_metadata?.company_name || 'CALAF.CO',
          createdAt: new Date(user.created_at),
          updatedAt: new Date()
        });
        
        // Kullanıcı verilerini Supabase'den yükle
        await loadUserData(user.id);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/login';
      }
    };

    checkAuthAndLoadData();
  }, [loadUserData, setAuth]);

  // Demo data yükleme - sadece bir kez çalışsın
  useEffect(() => {
    // Demo data oluşturma tamamen devre dışı - production'da gereksiz
    // Demo data sadece development'da manuel olarak çalıştırılacak
    console.log('Demo data oluşturma devre dışı - production ortamı');
  }, []);

  // Kasa seçimi güncelleme
  useEffect(() => {
    const defaultCashAccount = cashAccounts.find(ca => ca.isDefault) || cashAccounts[0];
    if (defaultCashAccount && !selectedCashAccountId) {
      setSelectedCashAccountId(defaultCashAccount.id);
    }
  }, [cashAccounts, selectedCashAccountId]);

  // Tarih aralığı hesaplama fonksiyonu
  const getDateRange = (rangeType: string) => {
    const today = new Date();
    
    switch (rangeType) {
      // Geçmiş
      case 'last_7':
        return { start: subDays(today, 7), end: today, days: 7, title: 'Son 7 Gün' };
      case 'last_14':
        return { start: subDays(today, 14), end: today, days: 14, title: 'Son 14 Gün' };
      case 'last_30':
        return { start: subDays(today, 30), end: today, days: 30, title: 'Son 30 Gün' };
      case 'last_60':
        return { start: subDays(today, 60), end: today, days: 60, title: 'Son 60 Gün' };
      case 'last_90':
        return { start: subDays(today, 90), end: today, days: 90, title: 'Son 90 Gün' };
      
      // Gelecek
      case 'next_7':
        return { start: today, end: addDays(today, 7), days: 7, title: 'Önümüzdeki 7 Gün' };
      case 'next_14':
        return { start: today, end: addDays(today, 14), days: 14, title: 'Önümüzdeki 14 Gün' };
      case 'next_30':
        return { start: today, end: addDays(today, 30), days: 30, title: 'Önümüzdeki 30 Gün' };
      case 'next_60':
        return { start: today, end: addDays(today, 60), days: 60, title: 'Önümüzdeki 60 Gün' };
      
      // Bu ay ve gelecek ay
      case 'this_month':
        return { 
          start: startOfMonth(today), 
          end: endOfMonth(today), 
          days: endOfMonth(today).getDate(), 
          title: 'Bu Ay' 
        };
      case 'next_month':
        const nextMonth = addMonths(today, 1);
        return { 
          start: startOfMonth(nextMonth), 
          end: endOfMonth(nextMonth), 
          days: endOfMonth(nextMonth).getDate(), 
          title: 'Gelecek Ay' 
        };
      
      // Karma (geçmiş + gelecek)
      case 'around_15':
        return { start: subDays(today, 15), end: addDays(today, 15), days: 30, title: 'Çevresindeki 30 Gün' };
      case 'around_30':
        return { start: subDays(today, 30), end: addDays(today, 30), days: 60, title: 'Çevresindeki 60 Gün' };
      
      default:
        return { start: subDays(today, 30), end: today, days: 30, title: 'Son 30 Gün' };
    }
  };

  // Bu ayki ciro hesaplama
  const thisMonthRevenue = useMemo(() => {
    const startOfThisMonth = startOfMonth(new Date());
    const endOfThisMonth = endOfMonth(new Date());
    
    return transactions
      .filter(t => 
        t.type === 'income' && 
        isAfter(new Date(t.transactionDate), startOfThisMonth) &&
        isBefore(new Date(t.transactionDate), endOfThisMonth)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Bu ayki giderler
  const thisMonthExpenses = useMemo(() => {
    const startOfThisMonth = startOfMonth(new Date());
    const endOfThisMonth = endOfMonth(new Date());
    
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        isAfter(new Date(t.transactionDate), startOfThisMonth) &&
        isBefore(new Date(t.transactionDate), endOfThisMonth)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Yaklaşan borçlar (30 gün içinde)
  const upcomingDebts = useMemo(() => {
    const next30Days = addDays(new Date(), 30);
    
    return debts
      .filter(d => 
        d.status === 'pending' && 
        isAfter(new Date(d.dueDate), new Date()) &&
        isBefore(new Date(d.dueDate), next30Days)
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [debts]);

  // Yaklaşan gelirler (30 gün içinde)
  const upcomingIncomes = useMemo(() => {
    const today = new Date();
    const next30Days = addDays(today, 30);
    
    return debts
      .filter(d => 
        d.type === 'receivable' && 
        d.status === 'pending' && 
        isAfter(new Date(d.dueDate), today) &&
        isBefore(new Date(d.dueDate), next30Days)
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [debts]);

  // Seçili dönemdeki gelir-gider özeti
  const selectedPeriodStats = useMemo(() => {
    const dateRange = getDateRange(chartDateRange);
    
    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transactionDate);
      return isAfter(transactionDate, dateRange.start) && isBefore(transactionDate, dateRange.end);
    });
    
    const totalIncome = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Bonuslardan gelen giderleri de ekle
    const periodBonusExpense = bonuses
      .filter(b => {
        const bonusDate = new Date(b.paymentDate);
        return isAfter(bonusDate, dateRange.start) && isBefore(bonusDate, dateRange.end);
      })
      .reduce((sum, b) => sum + b.amount, 0);
    
    return {
      income: totalIncome,
      expense: totalExpense + periodBonusExpense,
      net: totalIncome - (totalExpense + periodBonusExpense),
      transactionCount: periodTransactions.length,
      title: dateRange.title
    };
  }, [transactions, bonuses, chartDateRange]);

  // Grafik için günlük gelir-gider verileri (dinamik tarih aralığı)
  const chartData = useMemo(() => {
    const dateRange = getDateRange(chartDateRange);
    const { start, end } = dateRange;
    
    // Gün sayısını hesapla
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const data = [];
    
    for (let i = 0; i <= totalDays; i++) {
      const date = addDays(start, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayIncome = transactions
        .filter(t => t.type === 'income' && format(new Date(t.transactionDate), 'yyyy-MM-dd') === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const dayExpense = transactions
        .filter(t => t.type === 'expense' && format(new Date(t.transactionDate), 'yyyy-MM-dd') === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      // Bu günki bonusları da ekle
      const dayBonusExpense = bonuses
        .filter(b => format(new Date(b.paymentDate), 'yyyy-MM-dd') === dateStr)
        .reduce((sum, b) => sum + b.amount, 0);

      const totalDayExpense = dayExpense + dayBonusExpense;
      
      data.push({
        date: format(date, totalDays <= 14 ? 'dd MMM' : 'dd/MM'),
        gelir: dayIncome,
        gider: totalDayExpense,
        net: dayIncome - totalDayExpense,
        fullDate: dateStr
      });
    }
    
    return data;
  }, [transactions, bonuses, chartDateRange]);

  // Para formatı
  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  // Miktar gösterme/gizleme
  const displayAmount = (amount: number) => {
    return showAmounts ? formatCurrency(amount) : '••••••';
  };

  // Auth yüklenirken loading göster
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // User yoksa (auth failed) boş dön
  if (!user) {
    return null;
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Üst Başlık - Rakamları Göster/Gizle */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analiz & Raporlar</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShowAmounts}
            className="flex items-center gap-2"
          >
            {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showAmounts ? 'Rakamları Gizle' : 'Rakamları Göster'}
          </Button>
        </div>

        {/* Ana İstatistikler - Screenshot'taki gibi */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bu Ay Ciro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {displayAmount(thisMonthRevenue)}
              </div>
              <p className="text-xs text-gray-500">
                {transactions.filter(t => t.type === 'income').length} işlem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Kasa Durumu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {displayAmount(cashAccounts.reduce((sum, ca) => sum + ca.balance, 0))}
              </div>
              <p className="text-xs text-gray-500">
                {cashAccounts.length} kasa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aktif Cari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {clients.filter(c => c.isActive).length}
              </div>
              <p className="text-xs text-gray-500">
                aktif cari
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Personel Sayısı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {employees.filter(e => e.isActive).length}
              </div>
              <p className="text-xs text-gray-500">
                aktif personel
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Son 30 Gün Net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${thisMonthRevenue - thisMonthExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {displayAmount(thisMonthRevenue - thisMonthExpenses)}
              </div>
              <p className="text-xs text-gray-500">
                net kazanç
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Beklenen Alacaklar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {displayAmount(upcomingIncomes.reduce((sum, d) => sum + d.amount, 0))}
              </div>
              <p className="text-xs text-gray-500">
                30 gün içinde
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gelir-Gider Analizi ve Grafik - Referans dashboard'taki gibi */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {chartDateRange === 'last_30' ? 'Son 30 Gün' : 
                   chartDateRange === 'last_7' ? 'Son 7 Gün' :
                   chartDateRange === 'last_60' ? 'Son 60 Gün' : 
                   'Seçili Dönem'} Gelir-Gider Analizi
                </CardTitle>
                <CardDescription>
                  Detaylı finansal analiz ve projeksiyonlar
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={chartDateRange} onValueChange={setChartDateRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Geçmiş */}
                    <SelectItem value="last_7">Son 7 Gün</SelectItem>
                    <SelectItem value="last_14">Son 14 Gün</SelectItem>
                    <SelectItem value="last_30">Son 30 Gün</SelectItem>
                    <SelectItem value="last_60">Son 60 Gün</SelectItem>
                    <SelectItem value="last_90">Son 90 Gün</SelectItem>
                    
                    {/* Mevcut dönem */}
                    <SelectItem value="this_month">Bu Ay</SelectItem>
                    
                    {/* Gelecek */}
                    <SelectItem value="next_7">Önümüzdeki 7 Gün</SelectItem>
                    <SelectItem value="next_14">Önümüzdeki 14 Gün</SelectItem>
                    <SelectItem value="next_30">Önümüzdeki 30 Gün</SelectItem>
                    <SelectItem value="next_60">Önümüzdeki 60 Gün</SelectItem>
                    <SelectItem value="next_month">Gelecek Ay</SelectItem>
                    
                    {/* Karma (çevresindeki) */}
                    <SelectItem value="around_15">Çevresindeki 30 Gün</SelectItem>
                    <SelectItem value="around_30">Çevresindeki 60 Gün</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Özet rakamlar - Referans dashboard'taki gibi */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {displayAmount(selectedPeriodStats.income)}
                </div>
                <p className="text-sm text-gray-500">Toplam Gelir</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {displayAmount(selectedPeriodStats.expense)}
                </div>
                <p className="text-sm text-gray-500">Toplam Gider</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {displayAmount(cashAccounts.reduce((sum, ca) => sum + ca.balance, 0))}
                </div>
                <p className="text-sm text-gray-500">Kasa Bakiyesi</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {displayAmount(upcomingDebts.reduce((sum, d) => sum + d.amount, 0))}
                </div>
                <p className="text-sm text-gray-500">Ödenecek Borçlar</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${selectedPeriodStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {displayAmount(selectedPeriodStats.net)}
                </div>
                <p className="text-sm text-gray-500">Net Durum</p>
              </div>
            </div>

            {/* Grafik - Referans dashboard'taki gibi */}
            {showAmounts && chartData.length > 0 && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) => `${value.toLocaleString('tr-TR')} TL`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`,
                        name === 'gelir' ? 'Gelir' : 
                        name === 'gider' ? 'Gider' : 'Net'
                      ]}
                      labelFormatter={(label) => `Tarih: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gelir" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gider" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {!showAmounts && (
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <EyeOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Grafik görüntülemek için rakamları gösterin</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alt bölümler - Screenshot'taki gibi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Yaklaşan Borçlar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Yaklaşan Borçlar
              </CardTitle>
              <CardDescription>30 gün içinde ödenecek</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingDebts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Yaklaşan borç bulunamadı</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDebts.map((debt) => (
                    <div key={debt.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium">{debt.title}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(debt.dueDate), 'dd MMM yyyy', { locale: tr })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">{displayAmount(debt.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Yaklaşan Düzenli Ödemeler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Yaklaşan Düzenli Ödemeler
              </CardTitle>
              <CardDescription>Düzenli ödemeler</CardDescription>
            </CardHeader>
            <CardContent>
              {regularPayments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Yaklaşan düzenli ödeme bulunamadı</p>
              ) : (
                <div className="space-y-3">
                  {regularPayments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">{payment.title}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(payment.dueDate), 'dd MMM yyyy', { locale: tr })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{displayAmount(payment.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alt bölümler devam */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Yaklaşan Maaş Ödemeleri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Yaklaşan Maaş Ödemeleri
              </CardTitle>
              <CardDescription>Bu ay ödenecek maaşlar</CardDescription>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Yaklaşan maaş ödemesi bulunamadı</p>
              ) : (
                <div className="space-y-3">
                  {employees.filter(e => e.isActive).slice(0, 5).map((employee) => (
                    <div key={employee.id} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-gray-600">{employee.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">{displayAmount(employee.netSalary)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Beklenen Fatura Bakiyeleri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                Beklenen Fatura Bakiyeleri
              </CardTitle>
              <CardDescription>Tahsil edilecek</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingIncomes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Beklenen fatura bakiyesi bulunamadı</p>
              ) : (
                <div className="space-y-3">
                  {upcomingIncomes.map((income) => (
                    <div key={income.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">{income.title}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(income.dueDate), 'dd MMM yyyy', { locale: tr })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{displayAmount(income.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Demo Veriler Butonu */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Veriler</CardTitle>
            <CardDescription>Test verilerini yükleyerek sistemi deneyebilirsiniz</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createDemoData}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            >
              Demo Veriler Oluştur
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}