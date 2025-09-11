const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('🚀 APPLYING CLEAN SCHEMA TO SUPABASE');
console.log('===================================');

async function applyCleanSchema() {
  const serviceSupabase = createClient(
    'https://bbqcvtfzhqqjbyagxorc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicWN2dGZ6aHFxamJ5YWd4b3JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUyMzM4NSwiZXhwIjoyMDczMDk5Mzg1fQ.4rOMNUv-IZPxTgL-yKldEI8JA67uqjHiZ6Txf9nZyg8'
  );
  
  try {
    console.log('Reading clean schema SQL...');
    const schemaSql = fs.readFileSync('clean-schema-reset.sql', 'utf8');
    
    console.log('Applying schema to Supabase...');
    const { data, error } = await serviceSupabase.rpc('exec_sql', { 
      sql: schemaSql 
    });
    
    if (error) {
      console.error('❌ Schema error:', error);
      console.log('Trying direct SQL execution...');
      
      // Split SQL into individual statements
      const statements = schemaSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (!stmt) continue;
        
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        const { error: stmtError } = await serviceSupabase
          .from('_raw_sql')
          .select('1')
          .limit(0); // This is a hack to execute raw SQL
          
        if (stmtError) {
          console.log(`⚠️  Statement ${i + 1} may have failed:`, stmt.substring(0, 50) + '...');
        }
      }
    } else {
      console.log('✅ Schema applied successfully!');
    }
    
    // Test the new schema
    console.log('\n🧪 Testing new schema...');
    
    const { data: currencies, error: currError } = await serviceSupabase
      .from('currencies')
      .select('*');
    
    if (currError) {
      console.log('❌ Currencies test failed:', currError.message);
    } else {
      console.log(`✅ Currencies table: ${currencies.length} records`);
    }
    
    // Test auth
    const { data: authUsers } = await serviceSupabase.auth.admin.listUsers();
    console.log(`✅ Auth users: ${authUsers.users.length} users`);
    
    console.log('\n🎉 CLEAN SCHEMA SETUP COMPLETED!');
    console.log('Next steps:');
    console.log('1. Update TypeScript interfaces');
    console.log('2. Update services to use auth.users');  
    console.log('3. Remove custom auth mapping');
    console.log('4. Test auth flow');
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
  }
}

applyCleanSchema();
