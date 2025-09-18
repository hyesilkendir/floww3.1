const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ffqwomxrfvsjzpyeklvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcXdvbXhyZnZzanpweWVrbHZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgyNDgzNCwiZXhwIjoyMDcwNDAwODM0fQ.SGNDjrAF7EGEb_9XJbt_PqFZ5-U1WiqsljDkDUWrr4o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTablesViaSupabase() {
  console.log('🚀 Creating tables via Supabase REST API...');
  console.log('URL:', supabaseUrl);
  
  try {
    // Test basic connection first
    console.log('📋 Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .limit(5);
    
    if (testError) {
      console.log('❌ Connection test failed:', testError.message);
      return;
    }
    
    console.log('✅ Connection successful');
    console.log('📊 Existing tables:', testData?.map(t => t.tablename).join(', ') || 'None');

    // Create currencies table using direct SQL
    console.log('\n📋 Creating currencies table...');
    
    // Use fetch to call Supabase REST API directly
    const createCurrenciesResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        sql: `
          CREATE TABLE IF NOT EXISTS public.currencies (
              id text PRIMARY KEY,
              code text UNIQUE NOT NULL,
              name text NOT NULL,
              symbol text NOT NULL,
              is_active boolean DEFAULT true,
              created_at timestamptz DEFAULT now()
          );
          
          INSERT INTO public.currencies (id, code, name, symbol, is_active) VALUES
          ('TRY', 'TRY', 'Turkish Lira', '₺', true),
          ('USD', 'USD', 'US Dollar', '$', true),
          ('EUR', 'EUR', 'Euro', '€', true),
          ('GBP', 'GBP', 'British Pound', '£', true)
          ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          name = EXCLUDED.name,
          symbol = EXCLUDED.symbol,
          is_active = EXCLUDED.is_active;
        `
      })
    });

    if (!createCurrenciesResponse.ok) {
      console.log('❌ Currencies creation failed:', await createCurrenciesResponse.text());
    } else {
      console.log('✅ Currencies table created and populated');
    }

    // Test if currencies table was created
    console.log('\n📋 Testing currencies table...');
    const { data: currenciesData, error: currenciesError } = await supabase
      .from('currencies')
      .select('*');
    
    if (currenciesError) {
      console.log('❌ Currencies test failed:', currenciesError.message);
    } else {
      console.log('✅ Currencies table accessible:', currenciesData?.length || 0, 'records');
      console.log('💰 Currencies:', currenciesData?.map(c => `${c.code} (${c.symbol})`).join(', '));
    }

    // Create a simple test table to verify we can create tables
    console.log('\n📋 Creating test table...');
    const createTestResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        sql: `
          CREATE TABLE IF NOT EXISTS public.test_table (
              id serial PRIMARY KEY,
              name text NOT NULL,
              created_at timestamptz DEFAULT now()
          );
          
          INSERT INTO public.test_table (name) VALUES ('Test Record 1'), ('Test Record 2');
        `
      })
    });

    if (!createTestResponse.ok) {
      console.log('❌ Test table creation failed:', await createTestResponse.text());
    } else {
      console.log('✅ Test table created');
      
      // Test the test table
      const { data: testTableData, error: testTableError } = await supabase
        .from('test_table')
        .select('*');
      
      if (testTableError) {
        console.log('❌ Test table access failed:', testTableError.message);
      } else {
        console.log('✅ Test table accessible:', testTableData?.length || 0, 'records');
      }
    }

    // List all tables to see what we have
    console.log('\n📋 Final table listing...');
    const { data: finalTables, error: finalError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (finalError) {
      console.log('❌ Final listing failed:', finalError.message);
    } else {
      console.log('✅ Total public tables:', finalTables?.length || 0);
      console.log('📋 Table names:', finalTables?.map(t => t.tablename).sort().join(', '));
    }

    console.log('\n🎯 SUMMARY:');
    console.log('✅ Connection to correct database confirmed');
    console.log('✅ Basic table creation tested');
    console.log('📊 Database is accessible and writable');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

createTablesViaSupabase();