# 🚀 FLOWW3 Deploy Rehberi

## Otomatik Deploy Sistemi

Bu proje artık otomatik deploy sistemi ile donatılmıştır. Her güncellemeden sonra tek komutla Vercel'e deploy edebilirsiniz.

## Deploy Komutları

### 1. Tam Deploy (Build + Deploy + Log)
```bash
npm run deploy
```
Bu komut:
- ✅ Build kontrolü yapar
- 🌐 Vercel'e production deploy eder
- 📝 Deploy log'u kaydeder
- 🔗 Deploy URL'ini gösterir

### 2. Hızlı Deploy (Sadece Deploy)
```bash
npm run deploy:quick
```
Bu komut sadece Vercel deploy işlemini yapar.

## Deploy Durumu

✅ **Son Deploy:** 2025-09-12 14:42:40  
🔗 **URL:** https://floww3-kilvcw3e7-calafcoo-6218s-projects.vercel.app  
📝 **Log:** deploy.log dosyasında kayıtlı

## Deploy Süreci

1. **Build Kontrolü**: Next.js build sürecini çalıştırır
2. **Vercel Deploy**: Production ortamına deploy eder
3. **URL Extraction**: Deploy URL'ini otomatik bulur
4. **Logging**: Başarı/hata durumunu loglar

## Deploy Log'ları

Deploy işlemlerinin tüm kayıtları `deploy.log` dosyasında tutulur:
- ✅ Başarılı deploy'lar
- ❌ Hata durumları
- 🕐 Timestamp bilgileri
- 🔗 Deploy URL'leri

## Önemli Notlar

- Her deploy öncesi otomatik build yapılır
- Environment variables `.env.local` dosyasından alınır
- Vercel CLI'ın yüklü olması gerekir
- Proje zaten Vercel'e bağlıdır (project.json mevcut)

## Troubleshooting

### Deploy Hatası Alıyorsanız:
1. `npm run build` komutunu test edin
2. `.env.local` dosyasını kontrol edin
3. Vercel CLI güncel mi kontrol edin: `vercel --version`
4. `deploy.log` dosyasını inceleyin

### Vercel CLI Kurulumu:
```bash
npm i -g vercel
vercel login
```

## Otomatik Deploy Script'i

`deploy.js` dosyası tam otomatik deploy sürecini yönetir:
- Build kontrolü
- Deploy işlemi
- URL extraction
- Error handling
- Logging

Bu sistem sayesinde her code değişikliğinden sonra tek komutla production'a deploy edebilirsiniz!
