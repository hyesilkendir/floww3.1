const http = require('http');

async function testAppPages() {
  console.log('🔵 Testing App Pages...\n');
  
  const pages = [
    { name: 'Login', path: '/login' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Invoices', path: '/invoices' },
    { name: 'Clients', path: '/clients' },
    { name: 'Expenses', path: '/expenses' },
    { name: 'Income', path: '/income' }
  ];
  
  for (const page of pages) {
    try {
      const response = await fetch(`http://localhost:3000${page.path}`);
      const status = response.status;
      const statusText = response.ok ? '✅ OK' : '❌ ERROR';
      
      console.log(`${statusText} ${page.name} (${page.path}): ${status}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.log(`   Error details: ${text.substring(0, 100)}...`);
      }
      
    } catch (err) {
      console.log(`❌ ${page.name} (${page.path}): FAILED - ${err.message}`);
    }
  }
  
  console.log('\n🔍 Testing completed.');
}

testAppPages();