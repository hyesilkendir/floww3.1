'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Register form
  const [registerData, setRegisterData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        setError('E-posta veya şifre yanlış');
        return;
      }

      if (data.user) {
        // Başarılı giriş - direkt analiz sayfasına git
        window.location.href = '/analiz';
      }
    } catch (err) {
      setError('Giriş sırasında hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validations
    if (registerData.password !== registerData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setIsLoading(false);
      return;
    }
    
    if (registerData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      setIsLoading(false);
      return;
    }
    
    if (registerData.username.length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            username: registerData.username,
            name: registerData.name,
            company_name: 'CALAF.CO',
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Bu e-posta zaten kayıtlı');
        } else {
          setError(error.message || 'Kayıt olurken bir hata oluştu');
        }
        return;
      }

      if (data.user) {
        // Kayıt başarılı - otomatik giriş dene
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: registerData.email,
          password: registerData.password,
        });
        
        if (!signInError) {
          window.location.href = '/dashboard';
      } else {
          setError('');
          setActiveTab('login');
          alert('Kayıt başarılı! Giriş yapabilirsiniz.');
        }
      }
    } catch (err) {
      setError('Kayıt olurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Tab Navigation */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' && (
        <Card>
          <CardHeader>
              <CardTitle>Hesabınıza Giriş Yapın</CardTitle>
              <CardDescription>Email ve şifrenizi girin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="email"
                  placeholder="E-posta"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                <Input
                  type="password"
                  placeholder="Şifre"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Button>
            </form>
          </CardContent>
        </Card>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
        <Card>
          <CardHeader>
              <CardTitle>Yeni Hesap Oluşturun</CardTitle>
              <CardDescription>Bilgilerinizi girin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Ad Soyad"
                  value={registerData.name}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                <Input
                  type="text"
                  placeholder="Kullanıcı Adı"
                  value={registerData.username}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                <Input
                  type="email"
                  placeholder="E-posta"
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                <Input
                  type="password"
                  placeholder="Şifre"
                  value={registerData.password}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                <Input
                  type="password"
                  placeholder="Şifre (Tekrar)"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
                </Button>
            </form>
          </CardContent>
        </Card>
        )}

        {/* Company Info */}
        <div className="text-center text-sm text-gray-600">
          <p>CALAF.CO Muhasebe Sistemi</p>
        </div>
      </div>
    </div>
  );
}