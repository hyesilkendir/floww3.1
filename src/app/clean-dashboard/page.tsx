'use client';

// 🚀 CLEAN DASHBOARD - SUPABASE-FIRST APPROACH

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCleanStore } from '@/lib/clean-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CleanDashboardPage() {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    loading, 
    error,
    categories,
    clients,
    employees,
    transactions,
    currencies,
    getCurrentUser,
    signOut,
    addClient,
    addEmployee,
    addTransaction
  } = useCleanStore();

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated) {
      getCurrentUser();
    }
  }, [isAuthenticated, getCurrentUser]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/clean-login');
    }
  }, [loading, isAuthenticated, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/clean-login');
  };

  const testAddClient = async () => {
    await addClient({
      name: 'Test Client ' + Date.now(),
      email: 'test@example.com',
      currency_id: '1',
      balance: 0,
      is_active: true
    });
  };

  const testAddEmployee = async () => {
    await addEmployee({
      name: 'Test Employee ' + Date.now(),
      position: 'Developer',
      net_salary: 15000,
      currency_id: '1',
      payroll_period: 'monthly',
      payment_day: 1,
      is_active: true
    });
  };

  const testAddTransaction = async () => {
    await addTransaction({
      type: 'income',
      amount: 1000,
      description: 'Test transaction ' + Date.now(),
      currency_id: '1',
      transaction_date: new Date().toISOString().split('T')[0],
      is_vat_included: false,
      vat_rate: 0,
      is_recurring: false
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                FLOWW3 - Clean Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Hoş geldiniz, {user.email}
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stats Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Kategoriler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cariler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clients.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Personel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employees.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  İşlemler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactions.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Test Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Test İşlemleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-x-4">
                <Button onClick={testAddClient} disabled={loading}>
                  Test Cari Ekle
                </Button>
                <Button onClick={testAddEmployee} disabled={loading}>
                  Test Personel Ekle
                </Button>
                <Button onClick={testAddTransaction} disabled={loading}>
                  Test İşlem Ekle
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Display */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Son Cariler</CardTitle>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <p className="text-gray-500">Henüz cari yok</p>
                ) : (
                  <ul className="space-y-2">
                    {clients.slice(0, 5).map(client => (
                      <li key={client.id} className="text-sm">
                        {client.name} - {client.email}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Son Personel</CardTitle>
              </CardHeader>
              <CardContent>
                {employees.length === 0 ? (
                  <p className="text-gray-500">Henüz personel yok</p>
                ) : (
                  <ul className="space-y-2">
                    {employees.slice(0, 5).map(employee => (
                      <li key={employee.id} className="text-sm">
                        {employee.name} - {employee.position}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Son İşlemler</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-gray-500">Henüz işlem yok</p>
                ) : (
                  <ul className="space-y-2">
                    {transactions.slice(0, 5).map(transaction => (
                      <li key={transaction.id} className="text-sm">
                        {transaction.type === 'income' ? '+' : '-'}{transaction.amount}₺ - {transaction.description}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Kullanıcı Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Kayıt Tarihi:</strong> {new Date(user.created_at).toLocaleDateString('tr-TR')}</p>
                <p><strong>Para Birimleri:</strong> {currencies.length} adet</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
