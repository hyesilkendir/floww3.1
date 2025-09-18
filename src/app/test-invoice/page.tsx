'use client';

import { useState } from 'react';
import { useCleanStore } from '@/lib/clean-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestInvoicePage() {
  const { addInvoice, user, clients, currencies, loading, error } = useCleanStore();
  const [testResult, setTestResult] = useState<string>('');

  const testInvoiceCreation = async () => {
    setTestResult('Test başlıyor...');
    
    try {
      console.log('🔍 TEST: User:', user);
      console.log('🔍 TEST: Clients:', clients);
      console.log('🔍 TEST: Currencies:', currencies);

      if (!user) {
        setTestResult('❌ HATA: Kullanıcı girişi gerekli');
        return;
      }

      if (clients.length === 0) {
        setTestResult('❌ HATA: Hiç cari bulunamadı');
        return;
      }

      const testInvoiceData = {
        clientId: clients[0].id,
        invoiceNumber: `TEST-${Date.now()}`,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonra
        description: 'Test Faturası',
        items: [
          {
            id: '1',
            description: 'Test Hizmeti',
            quantity: 1,
            unitPrice: 100,
            total: 100
          }
        ],
        subtotal: 100,
        vatRate: 18,
        vatAmount: 18,
        tevkifatApplied: false,
        tevkifatAmount: 0,
        total: 118,
        netAmountAfterTevkifat: 118,
        status: 'draft',
        notes: 'Test notu',
        isRecurring: false,
        paidAmount: 0,
        remainingAmount: 118,
        currencyId: 'TRY',
      };

      console.log('🔍 TEST: Test invoice data:', testInvoiceData);
      setTestResult('📤 Fatura ekleniyor...');

      await addInvoice(testInvoiceData);
      
      setTestResult('✅ BAŞARILI: Test faturası başarıyla eklendi!');
    } catch (err: any) {
      console.error('🔍 TEST: Hata:', err);
      setTestResult(`❌ HATA: ${err.message || err}`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Fatura Ekleme Test Sayfası</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p><strong>Kullanıcı:</strong> {user ? user.email : 'Giriş yapılmamış'}</p>
            <p><strong>Cari Sayısı:</strong> {clients.length}</p>
            <p><strong>Para Birimi Sayısı:</strong> {currencies.length}</p>
            <p><strong>Loading:</strong> {loading ? 'Evet' : 'Hayır'}</p>
            {error && <p className="text-red-500"><strong>Hata:</strong> {error}</p>}
          </div>
          
          <Button 
            onClick={testInvoiceCreation}
            disabled={loading || !user}
          >
            🧪 Test Faturası Oluştur
          </Button>
          
          {testResult && (
            <div className="p-4 border rounded-md bg-gray-50">
              <pre className="whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}