'use client';

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Hata Oluştu</h1>
          <p className="text-gray-600 mb-6">
            Kimlik doğrulama işlemi sırasında bir hata oluştu. 
            Lütfen e-posta adresinizi kontrol edin ve tekrar deneyin.
          </p>
          <a 
            href="/login" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Giriş Sayfasına Dön
          </a>
        </div>
      </div>
    </div>
  );
}
