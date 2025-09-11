'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthLayout } from '@/components/layout/auth-layout';
import { useAppStore } from '@/lib/store';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { loadUserData, setAuth } = useAppStore();

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
          password: '', // Şifre saklanmaz
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

  // Auth yüklenirken loading göster
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // User yoksa (auth failed) boş dön, zaten login'e yönlendiriliyor
  if (!user) {
    return null;
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Üst Başlık */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        {/* Hoş Geldin Mesajı */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">FLOWW Muhasebe Programına Hoş Geldiniz!</h2>
          <p className="text-blue-100 mb-4">
            Modern ve kullanıcı dostu muhasebe çözümünüz ile işlerinizi kolaylaştırın.
          </p>
          {user && (
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm">
                <strong>Kullanıcı:</strong> {user.email}
              </p>
              <p className="text-sm">
                <strong>Durum:</strong> Aktif - Sistem Hazır
              </p>
            </div>
          )}
        </div>

        {/* Sistem Durumu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supabase Auth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Çalışıyor</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Bağlı</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sistem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Aktif</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hızlı Erişim */}
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Erişim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/analiz" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center">
                <div className="text-blue-600 font-semibold">📊 Analiz</div>
                <div className="text-sm text-gray-600">Grafikler & Raporlar</div>
              </a>
              <a href="/clients" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
                <div className="text-green-600 font-semibold">👥 Cariler</div>
                <div className="text-sm text-gray-600">Müşteri Yönetimi</div>
              </a>
              <a href="/income" className="p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors text-center">
                <div className="text-emerald-600 font-semibold">📈 Gelirler</div>
                <div className="text-sm text-gray-600">Gelir Takibi</div>
              </a>
              <a href="/expenses" className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-center">
                <div className="text-red-600 font-semibold">📉 Giderler</div>
                <div className="text-sm text-gray-600">Gider Yönetimi</div>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Bilgilendirme */}
        <Card>
          <CardHeader>
            <CardTitle>Sistem Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✅ Tüm sistemler çalışır durumda</p>
              <p>✅ Supabase veritabanı bağlantısı aktif</p>
              <p>✅ Kullanıcı kimlik doğrulaması çalışıyor</p>
              <p className="mt-4 text-blue-600">
                📊 <strong>Detaylı analiz ve grafikler için "Analiz & Raporlar" sayfasını ziyaret edin</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
