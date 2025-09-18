const { chromium } = require('playwright');

async function testLogin() {
  console.log('🔵 Login Flow Test Started');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Fill login form
    console.log('2. Filling login form...');
    await page.fill('input[type="email"]', 'admin@calaf.co');
    await page.fill('input[type="password"]', '532d7315');
    
    // Submit form
    console.log('3. Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for redirect or error
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('4. Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful - redirected to dashboard');
    } else if (currentUrl.includes('/login')) {
      const errorText = await page.textContent('.bg-red-50');
      console.log('❌ Login failed - error:', errorText);
    } else {
      console.log('🔄 Redirected to:', currentUrl);
    }
    
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  } finally {
    await browser.close();
  }
}

// Fallback to simple fetch if playwright not available
async function simpleTest() {
  console.log('🔵 Simple Login Test (without browser)');
  
  const response = await fetch('http://localhost:3000/login');
  if (response.ok) {
    console.log('✅ Login page loads successfully');
    console.log('Status:', response.status);
  } else {
    console.log('❌ Login page failed to load');
  }
}

// Try playwright first, fallback to simple test
testLogin().catch(() => {
  console.log('⚠️ Playwright not available, using simple test...');
  simpleTest();
});