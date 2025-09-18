'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
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
      
      // Session persistence ayarı
      const sessionStorageType = loginData.rememberMe ? 'local' : 'session';
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        console.error('Login error:', error);
        
        // Detaylı hata mesajları
        if (error.message.includes('Invalid login credentials')) {
          setError('E-posta veya şifre yanlış. Hesabınız var mı?');
        } else if (error.message.includes('Email not confirmed')) {
          setError('E-posta adresinizi doğrulamalısınız. E-postanızı kontrol edin.');
        } else if (error.message.includes('Too many requests')) {
          setError('Çok fazla deneme. Lütfen biraz bekleyin.');
        } else {
          setError(`Giriş hatası: ${error.message}`);
        }
        return;
      }

      if (data.user) {
        console.log('✅ Login successful:', data.user.email);
        
        // User'ı storage'a kaydet - remember me'ye göre localStorage veya sessionStorage
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email || 'Kullanıcı',
          username: data.user.user_metadata?.username || (data.user.email ? data.user.email.split('@')[0] : 'user'),
          company_name: data.user.user_metadata?.company_name || 'CALAF.CO'
        };
        
        if (loginData.rememberMe) {
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('rememberMe', 'true');
          // Session storage'dan temizle
          sessionStorage.removeItem('user');
        } else {
          sessionStorage.setItem('user', JSON.stringify(userData));
          localStorage.removeItem('rememberMe');
          // Local storage'dan temizle
          localStorage.removeItem('user');
        }
        
        // Başarılı giriş - dashboard sayfasına git
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Login catch error:', err);
      setError('Beklenmeyen bir hata oluştu');
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
      
      // Production URL for email confirmation
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://floww3-1.vercel.app';
      
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          emailRedirectTo: `${baseUrl}/auth/confirm`,
          data: {
            username: registerData.username,
            name: registerData.name,
            company_name: 'CALAF.CO',
          },
        },
      });

      if (error) {
        console.error('Register error:', error);
        
        if (error.message.includes('already registered')) {
          setError('Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.');
        } else if (error.message.includes('Password should be')) {
          setError('Şifre en az 6 karakter olmalıdır');
        } else if (error.message.includes('Unable to validate email')) {
          setError('Geçersiz e-posta adresi. Lütfen geçerli bir e-posta girin.');
        } else if (error.message.includes('Database error')) {
          setError('Veritabanı hatası. Lütfen daha sonra tekrar deneyin.');
        } else if (error.message.includes('Email address')) {
          setError('E-posta adresi geçersiz. Lütfen farklı bir e-posta deneyin.');
        } else {
          setError(`Kayıt hatası: ${error.message}`);
        }
        return;
      }

      if (data.user) {
        console.log('✅ Registration successful:', data.user.email);
        
        if (data.user.email_confirmed_at) {
          // E-posta onaylandı - otomatik giriş yap
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: registerData.email,
            password: registerData.password,
          });
          
          if (!signInError) {
            window.location.href = '/dashboard';
            return;
          }
        }
        
        // E-posta onayı gerekli
        setError('');
        setActiveTab('login');
        alert(`Kayıt başarılı! ${registerData.email} adresine gönderilen doğrulama linkine tıklayın ve ardından giriş yapın. E-posta gelmezse spam klasörünü kontrol edin.`);
      }
    } catch (err) {
      console.error('Register catch error:', err);
      setError('Beklenmeyen bir hata oluştu');
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
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="login-remember-me"
                    checked={loginData.rememberMe}
                    onCheckedChange={(checked) =>
                      setLoginData(prev => ({ ...prev, rememberMe: checked as boolean }))
                    }
                  />
                  <label
                    htmlFor="login-remember-me"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Beni hatırla
                  </label>
                </div>
                
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