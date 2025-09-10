import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { email, password, username, name } = await req.json();

    if (!email || !password || !username || !name) {
      return NextResponse.json({ message: 'Zorunlu alanlar eksik' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Şifre en az 6 karakter olmalıdır' }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ message: 'Kullanıcı adı en az 3 karakter olmalıdır' }, { status: 400 });
    }

    const supabase = await createClient();

    // Supabase auth ile kullanıcı oluştur
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          name,
          company_name: 'CALAF.CO',
        },
      },
    });

    if (error) {
      console.error('Supabase auth error:', error);
      
      // Türkçe hata mesajları
      if (error.message.includes('already registered')) {
        return NextResponse.json({ message: 'Bu e-posta zaten kayıtlı' }, { status: 409 });
      }
      
      return NextResponse.json({ 
        message: error.message || 'Kayıt olurken bir hata oluştu' 
      }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ message: 'Kullanıcı oluşturulamadı' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      userId: data.user.id,
      message: 'Kayıt başarılı! E-posta doğrulama linkini kontrol edin.'
    });

  } catch (error: any) {
    console.error('register error', error);
    const message = typeof error?.message === 'string' ? error.message : 'Sunucu hatası';
    return NextResponse.json({ message }, { status: 500 });
  }
}
