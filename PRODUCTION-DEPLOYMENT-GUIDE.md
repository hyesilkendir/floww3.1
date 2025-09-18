# FlowW3 Production Deployment Rehberi

## 📋 Ön Gereksinimler

### 1. Environment Variables Kurulumu
Production ortamında aşağıdaki environment variable'ları ayarlayın:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
POSTGRES_URL=postgresql://postgres:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.co:6543/postgres

# Application Configuration
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters
NEXTAUTH_URL=https://your-production-domain.com
NODE_ENV=production

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Company Settings
COMPANY_NAME=YOUR_COMPANY_NAME
APP_VERSION=1.0.0
```

### 2. Supabase Auth Configuration
Supabase Dashboard'da aşağıdaki ayarları yapın:

1. **Site URL**: `https://your-production-domain.com`
2. **Redirect URLs**: 
   - `https://your-production-domain.com/auth/confirm`
   - `https://your-production-domain.com/dashboard`
3. **Email Templates**: Production domain'inizi kullanacak şekilde güncelleyin

## 🚀 Vercel Deployment

### 1. Otomatik Deployment
```bash
npm run deploy:vercel
```

### 2. Manuel Deployment
```bash
# Build kontrolü
npm run build:production

# Vercel'e deploy
vercel --prod
```

### 3. Environment Variables (Vercel Dashboard)
Vercel Dashboard'da aşağıdaki environment variable'ları ekleyin:
- Tüm yukarıdaki environment variable'ları
- `VERCEL=1` (otomatik eklenir)

## 🔧 Production Optimizasyonları

### 1. Performans
- ✅ SWC minification aktif
- ✅ Image optimization yapılandırıldı
- ✅ Webpack optimizasyonları uygulandı
- ✅ Bundle analizi için gerekli ayarlar

### 2. Güvenlik
- ✅ Security headers yapılandırıldı
- ✅ CSP (Content Security Policy) uygulandı
- ✅ CSRF koruması aktif
- ✅ XSS koruması aktif

### 3. SEO & Analytics
- ✅ Meta tags optimize edildi
- ✅ Sitemap yapılandırması hazır
- ✅ Google Analytics desteği

## 📊 Monitoring & Health Check

### Health Check Endpoint
```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "uptime": 12345
}
```

### Monitoring Scripts
```bash
# Health check
npm run health-check

# Log monitoring
vercel logs --app=your-app-name
```

## 🗄️ Database Migration

### Production Migration
```bash
# Supabase migration (önerilen)
npx supabase db push

# Veya direct migration
npm run db:migrate
```

## 🔒 Güvenlik Kontrol Listesi

- [ ] Environment variable'lar güvenli şekilde ayarlandı
- [ ] Database bağlantıları SSL ile yapılandırıldı
- [ ] API rate limiting uygulandı
- [ ] CORS ayarları yapılandırıldı
- [ ] Authentication middleware aktif
- [ ] RLS (Row Level Security) politikaları aktif

## 🎯 Production Test Listesi

### 1. Functionality Tests
```bash
# Authentication flow
curl -X POST https://your-domain.com/api/auth/register

# Health check
curl https://your-domain.com/api/health

# Dashboard access (authenticated)
curl -H "Authorization: Bearer <token>" https://your-domain.com/api/dashboard
```

### 2. Performance Tests
- [ ] Page load times < 3s
- [ ] API response times < 500ms
- [ ] Image optimization working
- [ ] CDN cache working

### 3. Security Tests
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No sensitive data in client bundle
- [ ] Authentication required for protected routes

## 🚨 Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   npm run clean
   npm run reinstall
   npm run build:production
   ```

2. **Environment Variable Issues**
   - Verify all required variables are set
   - Check variable names (case sensitive)
   - Ensure no trailing spaces

3. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check database connection string
   - Ensure RLS policies allow access

4. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Check redirect URLs in Supabase
   - Ensure middleware is working

## 📞 Support

Production deployment sorunları için:
1. Logs kontrol edin: `vercel logs`
2. Health check yapın: `/api/health`
3. Environment variables'ı doğrulayın
4. Database bağlantısını test edin

## 🔄 Updates & Maintenance

### Regular Updates
```bash
# Dependencies update
npm update

# Security audit
npm audit fix

# Performance check
npm run build:production
```

### Backup Strategy
- Database: Supabase otomatik backup
- Code: Git repository
- Environment: Secure documentation