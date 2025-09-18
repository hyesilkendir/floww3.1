# Floww3 - AI Development Brief
*Modern Muhasebe ve CRM Uygulaması - Sıfırdan Geliştirme Rehberi*

## 🎯 Uygulama Özeti
Reklam ajansları ve küçük işletmeler için tasarlanmış, cari hesap yönetimi, faturalama, personel takibi ve finansal raporlama özelliklerini tek platformda birleştiren web uygulaması. Modern teknolojiler kullanılarak hızlı, kullanıcı dostu ve mobil uyumlu bir arayüz sunar.

## 🎨 Genel Tasarım Prensipleri
- **Modern ve minimal** arayüz (Tailwind CSS)
- **Mobil öncelikli** responsive tasarım
- **Dark/Light tema** desteği
- **Türkçe** yerelleştirme
- **Klavye kısayolları** ile hızlı işlem
- **Gerçek zamanlı** güncellemeler

## 📱 Ana Sayfalar ve İşlevsellik

### 1. GİRİŞ SAYFASI (`/login`)
**Amaç**: Kullanıcı kimlik doğrulama ve sistem erişimi

**Özellikler**:
- E-posta/şifre ile giriş
- "Beni hatırla" seçeneği
- Şifre sıfırlama bağlantısı
- Demo hesap girişi (test amaçlı)
- Temiz ve modern giriş formu

**UI Bileşenleri**:
- Ortalanmış giriş kartı
- Input alanları (e-posta, şifre)
- Giriş butonu ve bağlantılar
- Logo ve branding elementi

### 2. ANA PANEL (`/dashboard`)
**Amaç**: Finansal durum özeti ve hızlı erişim merkezi

**Özellikler**:
- **Özet Kartları**: Toplam ciro, kasa durumu, aktif cari sayısı, personel sayısı
- **Finansal Grafikler**: Aylık gelir-gider trendi, cari dağılım pasta grafiği
- **Yaklaşan İşlemler**: Ödenecek faturalar, maaş tarihleri, vade yaklaşanlar
- **Hızlı İşlemler**: Yeni fatura, gelir kaydı, gider kaydı butonları
- **Bildirimler**: Sistem uyarıları ve hatırlatıcılar

**UI Bileşenleri**:
- Grid layout ile kartlar
- İnteraktif grafikler (Chart.js/Recharts)
- Liste tabloları
- Aksiyon butonları

### 3. CARİ HESAPLAR (`/clients`)
**Amaç**: Müşteri ve tedarikçi yönetimi

**Özellikler**:
- **Cari Listesi**: Arama, filtreleme, sayfalama
- **Yeni Cari Ekleme**: Ad, iletişim, vergi bilgileri
- **Cari Detayları**: Bakiye durumu, hareket geçmişi, istatistikler
- **Toplu İşlemler**: Çoklu seçim ve güncelleme
- **Dışa Aktarma**: Excel/PDF formatında liste

**Veri Alanları**:
- Temel bilgiler: Ad, e-posta, telefon, adres
- İş bilgileri: Şirket adı, vergi numarası, yetkili kişi
- Finansal: Bakiye, kredi limiti, para birimi
- Sözleşme: Başlangıç/bitiş tarihi, durum

### 4. PERSONEL YÖNETİMİ (`/employees`)
**Amaç**: Çalışan bilgileri ve maaş takibi

**Özellikler**:
- **Personel Kayıtları**: Ad, pozisyon, maaş, bordro periyodu
- **Maaş Takibi**: Otomatik aylık maaş gideri oluşturma
- **Bonus/Avans**: Ekstra ödemeler ve kesintiler
- **Raporlama**: Personel maliyetleri, dönemsel özetler
- **Otomatik Hatırlatıcılar**: Maaş ödeme tarihleri

**Veri Alanları**:
- Kişisel: Ad, pozisyon, departman
- Finansal: Net maaş, bordro periyodu, ödeme günü
- İletişim: E-posta, telefon, adres
- İş: Başlama tarihi, aktif/pasif durum

### 5. GELİR TAKİBİ (`/income`)
**Amaç**: Gelir işlemlerinin kaydı ve takibi

**Özellikler**:
- **Gelir Kaydı**: Tutar, kategori, cari, tarih, açıklama
- **Kategori Yönetimi**: Özelleştirilebilir gelir kategorileri
- **Filtreleme**: Tarih aralığı, kategori, cari bazında
- **Toplu İşlemler**: Çoklu gelir kaydı
- **Raporlama**: Dönemsel gelir analizi

### 6. GİDER TAKİBİ (`/expenses`)
**Amaç**: Gider işlemlerinin kaydı ve kontrolü

**Özellikler**:
- **Gider Kaydı**: Tutar, kategori, cari, tarih, açıklama
- **Kategori Yönetimi**: Ofis, pazarlama, personel vb. kategoriler
- **Düzenli Ödemeler**: Kira, fatura, abonelik gibi tekrar eden giderler
- **Bütçe Kontrolü**: Kategori bazında bütçe sınırları
- **Analiz**: Gider trendleri ve karşılaştırma

### 7. KASA YÖNETİMİ (`/cash-accounts`)
**Amaç**: Nakit ve banka hesapları takibi

**Özellikler**:
- **Hesap Listesi**: Banka, nakit, kredi kartı hesapları
- **Bakiye Takibi**: Gerçek zamanlı bakiye güncelleme
- **Para Transferi**: Hesaplar arası transfer kayıtları
- **Dekont/Makbuz**: Belge yükleme ve saklama
- **Uzlaştırma**: Banka ekstreleri ile karşılaştırma

### 8. FATURALAMA (`/invoices`)
**Amaç**: Profesyonel fatura oluşturma ve takibi

**Özellikler**:
- **Fatura Oluşturma**: Kalem bazında detaylı faturalama
- **Şablon Sistemi**: Önceden tanımlı fatura şablonları  
- **KDV Hesaplama**: Otomatik vergi hesapları
- **Tevkifat**: Stopaj hesaplamaları
- **Tekrar Eden Faturalar**: Abonelik/düzenli hizmet faturaları
- **Ödeme Takibi**: Ödenmiş/ödenmemiş durum kontrolü
- **PDF Üretimi**: Profesyonel fatura dokümanı
- **E-posta Gönderimi**: Direkt müşteriye gönderim

### 9. TEKLİF YÖNETİMİ (`/quotes`)
**Amaç**: Müşteri tekliflerinin hazırlanması ve takibi

**Özellikler**:
- **Teklif Oluşturma**: Hizmet kalemleri, birim fiyat, miktar
- **Fiyatlandırma**: Dinamik fiyat hesaplama
- **Onay Süreci**: Teklif durumu takibi (bekliyor, onaylandı, reddedildi)
- **Şablon Kullanımı**: Hızlı teklif hazırlama
- **PDF/Word Çıktısı**: Profesyonel sunum formatı
- **Geçerlilik Tarihi**: Otomatik süre kontrolü

### 10. BORÇ/ALACAK (`/debts`)
**Amaç**: Ödeme planları ve vade takibi

**Özellikler**:
- **Borç Kayıtları**: Ödenecek tutarlar ve vadeler
- **Alacak Takibi**: Tahsil edilecek tutarlar
- **Ödeme Planı**: Taksitli ödemeler
- **Vade Uyarıları**: Otomatik hatırlatmalar
- **Durum Takibi**: Ödendi, gecikti, bekliyor

### 11. DÜZENLI ÖDEMELER (`/regular-payments`)
**Amaç**: Tekrar eden ödemelerin otomasyonu

**Özellikler**:
- **Ödeme Planları**: Aylık, üç aylık, yıllık periyotlar
- **Kategori Bazlı**: Kira, sigorta, abonelik, kredi taksitleri
- **Otomatik Kayıt**: Belirtilen tarihlerde otomatik gider kaydı
- **Hatırlatmalar**: Ödeme günlerinde bildirim
- **Düzenleme**: Plan değişiklikleri ve iptal

### 12. AYARLAR (`/settings`)
**Amaç**: Sistem yapılandırması ve kişiselleştirme

**Özellikler**:
- **Kullanıcı Profili**: Kişisel bilgiler ve şifre değişimi
- **Şirket Bilgileri**: Logo, adres, iletişim, vergi bilgileri
- **Kategori Yönetimi**: Özel kategori tanımlama
- **Para Birimleri**: Döviz kurları ve varsayılan para birimi
- **Tema Ayarları**: Dark/Light mode, renk şemaları
- **Bildirim Tercihleri**: E-posta, SMS, sistem bildirimleri
- **Yedekleme**: Veri dışa/içe aktarma

## 📊 Raporlama ve Analiz Özellikleri

### Finansal Raporlar
- **Gelir-Gider Raporu**: Dönemsel karşılaştırma
- **Cari Hesap Durumu**: Bakiye ve hareket raporları
- **Kar-Zarar Analizi**: Aylık/yıllık kârlılık
- **Nakit Akışı**: Para girişi-çıkışı takibi

### Görsel Analizler
- **Grafik Gösterimleri**: Çizgi, çubuk, pasta grafikleri
- **Trend Analizi**: Zaman bazlı değişim göstergeleri
- **Kategori Dağılımı**: Gelir/gider oranları
- **Cari Analizi**: En karlı müşteriler

## 🔧 Teknik Özellikler

### Frontend Teknolojileri
- **Framework**: Next.js 14 + React 18
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: Zustand
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Handling**: date-fns
- **PDF Generation**: jsPDF, html2canvas

### Backend & Veritabanı
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: RESTful endpoints
- **File Storage**: Supabase Storage
- **Real-time**: Supabase subscriptions

### Güvenlik ve Performans
- **Authentication**: JWT tabanlı güvenlik
- **Data Validation**: Form validation
- **Error Handling**: Kapsamlı hata yönetimi
- **Performance**: Lazy loading, code splitting
- **SEO**: Meta tags ve semantic HTML

## 💾 Veri Modeli Özeti

### Ana Tablolar
- **users**: Kullanıcı bilgileri ve yetkilendirme
- **clients**: Cari hesap bilgileri
- **employees**: Personel kayıtları
- **transactions**: Tüm finansal işlemler (gelir/gider)
- **categories**: İşlem kategorileri
- **currencies**: Para birimi tanımları
- **invoices**: Fatura bilgileri
- **quotes**: Teklif kayıtları
- **debts**: Borç/alacak takibi
- **regular_payments**: Düzenli ödemeler
- **company_settings**: Şirket ayarları

### İlişkiler
- Kullanıcı → Tüm kayıtlar (user_id)
- Cari → İşlemler (client_id)
- Personel → Maaş işlemleri (employee_id)
- Kategori → İşlemler (category_id)
- Para birimi → Tüm finansal kayıtlar

## 🎯 Kullanıcı Deneyimi Hedefleri

### Performans
- **Hızlı Yükleme**: 2 saniye altında sayfa açılması
- **Responsif**: Tüm cihazlarda sorunsuz kullanım
- **Offline**: Temel işlevlerin çevrimdışı çalışması

### Kullanıcı Dostu
- **Sezgisel Navigasyon**: Kolay menü sistemi
- **Hızlı İşlem**: Minimum tıklama ile işlem tamamlama
- **Görsel Geri Bildirim**: Loading states ve success mesajları
- **Hata Yönetimi**: Açıklayıcı hata mesajları

### Erişilebilirlik
- **Klavye Navigasyonu**: Tab ile gezinme
- **Screen Reader**: ARIA labels
- **Renk Kontrastı**: WCAG uyumlu renkler
- **Metin Boyutu**: Ayarlanabilir font büyüklüğü

## 🚀 Geliştirme Öncelikleri

### Faz 1 - Temel Özellikler (MVP)
1. Authentication sistemi
2. Dashboard ve ana navigasyon
3. Cari hesap yönetimi
4. Temel gelir/gider takibi
5. Basit raporlama

### Faz 2 - İleri Özellikler
1. Faturalama sistemi
2. Teklif yönetimi
3. Personel ve maaş takibi
4. Düzenli ödemeler

### Faz 3 - Analiz ve Optimizasyon
1. Gelişmiş raporlama
2. Grafik ve analizler
3. Export/Import özellikleri
4. Mobil optimizasyon

### Faz 4 - Otomasyon
1. Otomatik hatırlatmalar
2. Tekrar eden işlemler
3. E-posta entegrasyonları
4. API geliştirme

## 🎪 Ek Özellikler ve İyileştirmeler

### Kullanıcı Deneyimi
- **Onboarding**: Yeni kullanıcılar için rehber turu
- **Shortcuts**: Hızlı işlem tuş kombinasyonları
- **Bulk Operations**: Çoklu kayıt işlemleri
- **Search**: Global arama işlevselliği
- **Favorites**: Sık kullanılan işlemler

### İntegrasyon
- **E-posta**: SMTP entegrasyonu
- **SMS**: Bildirim servisleri
- **PDF**: Doküman üretimi
- **Excel**: İçe/dışa aktarım
- **API**: Üçüncü parti entegrasyonlar

### Güvenlik
- **Role Management**: Kullanıcı rolleri ve yetkileri
- **Audit Log**: İşlem geçmişi kayıtları
- **Backup**: Otomatik yedekleme
- **Encryption**: Veri şifreleme
- **2FA**: İki faktörlü doğrulama

## 📱 Mobil Uyumluluk

### Responsive Tasarım
- **Breakpoints**: Mobile-first yaklaşım
- **Touch Interface**: Dokunmatik optimizasyonu
- **Navigation**: Mobil menü sistemi
- **Input**: Mobil klavye uyumluluğu

### Performance
- **Progressive Web App**: PWA özellikleri
- **Offline Mode**: Çevrimdışı çalışma
- **Caching**: Akıllı önbellekleme
- **Loading**: Optimized loading states

## 🔄 Veri Akışı ve İş Mantığı

### İş Süreçleri
1. **Cari Ekleme** → Kategori Atama → İlk Bakiye
2. **Fatura Oluşturma** → KDV/Tevkifat → Ödeme Takibi
3. **Gider Kaydı** → Kategori → Bütçe Kontrolü
4. **Maaş İşlemi** → Otomatik Kayıt → Bordro

### Otomatik İşlemler
- **Recurring Invoices**: Tekrar eden faturalar
- **Salary Payments**: Maaş ödemeleri
- **Due Date Reminders**: Vade hatırlatmaları
- **Report Generation**: Periyodik raporlar

### Validasyon Kuralları
- **Zorunlu Alanlar**: Form validasyonu
- **Format Kontrolü**: E-posta, telefon, vergi no
- **Miktar Kontrolü**: Negatif değer kontrolü
- **Tarih Kontrolü**: Geçerli tarih aralıkları

## 🎨 UI/UX Detayları

### Renk Paleti
- **Primary**: Mavi tonları (#3B82F6)
- **Success**: Yeşil (#10B981)
- **Warning**: Turuncu (#F59E0B)
- **Error**: Kırmızı (#EF4444)
- **Neutral**: Gri tonları

### Typography
- **Headings**: Inter/System Font
- **Body**: 14px-16px arası
- **Monospace**: Rakamlar için

### Components
- **Cards**: Shadow ve border-radius
- **Buttons**: Hover effects
- **Forms**: Focus states
- **Tables**: Zebra striping
- **Charts**: Interactive tooltips

## 📈 Başarı Metrikleri

### Kullanıcı Metrikleri
- **Daily Active Users**: Günlük aktif kullanıcı
- **Session Duration**: Ortalama oturum süresi
- **Feature Adoption**: Özellik kullanım oranları
- **User Retention**: Kullanıcı sadakati

### İşletme Metrikleri
- **Invoice Volume**: Aylık fatura sayısı
- **Transaction Count**: İşlem hacmi
- **Error Rate**: Hata oranları
- **Performance**: Sayfa yükleme süreleri

## 🛠️ Development Guidelines

### Kod Standartları
- **TypeScript**: Strict mode
- **ESLint**: Kod kalitesi
- **Prettier**: Kod formatı
- **Testing**: Unit ve integration testleri

### Git Workflow
- **Feature Branches**: Özellik dalları
- **Code Review**: Kod inceleme
- **Automated Testing**: CI/CD pipeline
- **Documentation**: Kod dokümantasyonu

## 🔧 Deployment ve DevOps

### Hosting
- **Frontend**: Vercel/Netlify
- **Database**: Supabase
- **Assets**: CDN kullanımı
- **Monitoring**: Error tracking

### Environment
- **Development**: Local development
- **Staging**: Test ortamı
- **Production**: Canlı ortam
- **Backup**: Yedek sistemler

---

*Bu PRD, AI geliştirme sürecinde referans alınacak kapsamlı bir rehberdir. Her modül ve özellik detaylı olarak açıklanmış olup, geliştirme aşamasında teknisk spesifikasyonlar bu doküman temel alınarak oluşturulabilir.*

**Versiyon**: 1.0  
**Tarih**: Aralık 2024  
**Hedef**: Floww3 Sıfırdan Geliştirme
