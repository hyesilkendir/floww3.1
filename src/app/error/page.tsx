'use client';

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Hata Oluştu</h1>
          <p className="text-gray-600 mb-6">
            Uygulama yüklenirken bir hata oluştu. 
            Lütfen sayfayı yeniden yükleyin.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Sayfayı Yenile
            </button>
            <a 
              href="/login" 
              className="block w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors text-center"
            >
              Giriş Sayfasına Dön
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
