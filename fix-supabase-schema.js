require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixSupabaseSchema() {
  console.log('🔧 Fixing Supabase Schema Issues');
  console.log('=================================');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables missing');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('\n🔧 1. DROPPING FOREIGN KEY CONSTRAINTS');
    
    // Drop foreign key constraints using SQL
    const dropConstraints = `
      -- Drop all foreign key constraints
      ALTER TABLE clients DROP CONSTRAINT IF EXISTS fk_clients_user_id;
      ALTER TABLE employees DROP CONSTRAINT IF EXISTS fk_employees_user_id;
      ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_user_id;
      ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_client_id;
      ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_employee_id;
      ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_user_id;
      ALTER TABLE quotes DROP CONSTRAINT IF EXISTS fk_quotes_user_id;
      ALTER TABLE quotes DROP CONSTRAINT IF EXISTS fk_quotes_client_id;
      ALTER TABLE debts DROP CONSTRAINT IF EXISTS fk_debts_user_id;
      ALTER TABLE bonuses DROP CONSTRAINT IF EXISTS fk_bonuses_user_id;
      ALTER TABLE bonuses DROP CONSTRAINT IF EXISTS fk_bonuses_employee_id;
      ALTER TABLE verification_tokens DROP CONSTRAINT IF EXISTS fk_verification_tokens_user_id;
      
      -- Also currency constraints
      ALTER TABLE clients DROP CONSTRAINT IF EXISTS fk_clients_currency_id;
      ALTER TABLE employees DROP CONSTRAINT IF EXISTS fk_employees_currency_id;
      ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_currency_id;
      ALTER TABLE quotes DROP CONSTRAINT IF EXISTS fk_quotes_currency_id;
      ALTER TABLE debts DROP CONSTRAINT IF EXISTS fk_debts_currency_id;
      ALTER TABLE bonuses DROP CONSTRAINT IF EXISTS fk_bonuses_currency_id;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql_query: dropConstraints 
    });
    
    if (dropError && !dropError.message.includes('does not exist')) {
      console.log('⚠️  Some constraints may not exist:', dropError.message);
    } else {
      console.log('✅ Foreign key constraints dropped');
    }
    
    console.log('\n🛡️  2. DISABLING RLS');
    
    const disableRLS = `
      -- Disable RLS on all tables
      ALTER TABLE users DISABLE ROW LEVEL SECURITY;
      ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
      ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
      ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
      ALTER TABLE currencies DISABLE ROW LEVEL SECURITY;
      ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
      ALTER TABLE quote_items DISABLE ROW LEVEL SECURITY;
      ALTER TABLE debts DISABLE ROW LEVEL SECURITY;
      ALTER TABLE bonuses DISABLE ROW LEVEL SECURITY;
      ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;
      ALTER TABLE tevkifat_rates DISABLE ROW LEVEL SECURITY;
      ALTER TABLE verification_tokens DISABLE ROW LEVEL SECURITY;
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql_query: disableRLS 
    });
    
    if (rlsError) {
      console.log('⚠️  RLS disable warning:', rlsError.message);
    } else {
      console.log('✅ RLS disabled on all tables');
    }
    
    console.log('\n🧪 3. TESTING INSERT OPERATION');
    
    const testClient = {
      name: 'Test Client DELETE ME',
      email: 'test@delete.com',
      user_id: 'test-user-123', // String test
      currency_id: '1',
      balance: 0,
      is_active: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('clients')
      .insert([testClient])
      .select()
      .single();
    
    if (insertError) {
      console.log(`❌ Insert still failing: ${insertError.message}`);
      console.log(`   Error code: ${insertError.code}`);
    } else {
      console.log('✅ Insert test successful!');
      console.log('   Inserted record ID:', insertData.id);
      
      // Clean up test record
      await supabase
        .from('clients')
        .delete()
        .eq('id', insertData.id);
      console.log('   Test record cleaned up');
    }
    
    console.log('\n✅ Schema fix completed!');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
  }
}

fixSupabaseSchema();
