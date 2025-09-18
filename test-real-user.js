// Real User Authentication Test Script
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gjxlfeisaeojbgymehgf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeGxmZWlzYWVvamJneW1laGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzE4MTIsImV4cCI6MjA3MzUwNzgxMn0.bMCblgaWnkvzHDf1LwirPMRrSAypjt8EXVxr5a-Y9rE'
);

async function testRealUser() {
  console.log('🔐 Real User Authentication Test Başlıyor...\n');
  
  try {
    // Test with real user credentials
    console.log('1️⃣ Gerçek kullanıcı ile giriş testi...');
    const testEmail = 'yesilkendir@gmail.com';
    const testPassword = '087809';
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.log('❌ Giriş hatası:', signInError.message);
      
      // If user doesn't exist, try to create
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('\n2️⃣ Kullanıcı bulunamadı, yeni kayıt deneniyor...');
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
          options: {
            emailRedirectTo: 'https://floww3-1.vercel.app/auth/confirm',
            data: {
              username: 'yesilkendir',
              name: 'Test User',
              company_name: 'CALAF.CO',
            },
          },
        });

        if (signUpError) {
          console.log('❌ Kayıt hatası:', signUpError.message);
          return;
        } else {
          console.log('✅ Kayıt başarılı!');
          console.log('📧 E-posta doğrulama gerekli:', !signUpData.user?.email_confirmed_at);
          console.log('🔗 Doğrulama linki gönderildi:', testEmail);
        }
      }
    } else {
      console.log('✅ Giriş başarılı:', signInData.user?.email);
      console.log('   User ID:', signInData.user?.id);
      console.log('   Email confirmed:', !!signInData.user?.email_confirmed_at);
    }

    // Test database connection
    console.log('\n3️⃣ Veritabanı bağlantı testi...');
    const { data: testData, error: testError } = await supabase
      .from('currencies')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Veritabanı hatası:', testError.message);
    } else {
      console.log('✅ Veritabanı bağlantısı başarılı');
    }

    console.log('\n🎉 Test tamamlandı!');
    
  } catch (error) {
    console.error('❌ Test sırasında hata:', error.message);
  }
}

testRealUser();