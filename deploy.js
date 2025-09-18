#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 FLOWW3 Otomatik Deploy Başlatılıyor...\n');

try {
  // 1. Build kontrolü
  console.log('📦 Build kontrol ediliyor...');
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Build başarılı!\n');

  // 2. Vercel deploy
  console.log('🌐 Vercel\'e deploy ediliyor...');
  const deployOutput = execSync('vercel --prod', { 
    encoding: 'utf8', 
    cwd: __dirname 
  });
  
  console.log('✅ Deploy başarılı!\n');
  
  // URL'yi extract et
  const urlMatch = deployOutput.match(/https:\/\/[^\s]+\.vercel\.app/);
  if (urlMatch) {
    console.log('🔗 Deploy URL:', urlMatch[0]);
  }

  // 3. Deploy log'u kaydet
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp}: Deploy successful - ${urlMatch ? urlMatch[0] : 'URL not found'}\n`;
  
  require('fs').appendFileSync(
    path.join(__dirname, 'deploy.log'), 
    logEntry
  );

  console.log('\n🎉 Deploy tamamlandı!');
  console.log('📝 Log kaydedildi: deploy.log');

} catch (error) {
  console.error('❌ Deploy hatası:', error.message);
  
  // Hata log'u kaydet
  const timestamp = new Date().toISOString();
  const errorLog = `${timestamp}: Deploy failed - ${error.message}\n`;
  
  require('fs').appendFileSync(
    path.join(__dirname, 'deploy.log'), 
    errorLog
  );
  
  process.exit(1);
}
