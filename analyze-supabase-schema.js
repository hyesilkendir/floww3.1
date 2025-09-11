require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function analyzeSupabaseSchema() {
  console.log('🔍 Supabase Database Schema Analysis');
  console.log('=====================================');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables missing');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Check all tables
    console.log('\n📋 1. EXISTING TABLES:');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_info');
    
    if (tablesError) {
      // Alternative method - check each table individually
      const expectedTables = [
        'users', 'clients', 'employees', 'transactions', 'categories', 
        'currencies', 'quotes', 'quote_items', 'debts', 'bonuses', 
        'company_settings', 'tevkifat_rates', 'verification_tokens'
      ];
      
      for (const tableName of expectedTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (error) {
            console.log(`❌ ${tableName}: ${error.message}`);
          } else {
            console.log(`✅ ${tableName}: EXISTS`);
          }
        } catch (err) {
          console.log(`❌ ${tableName}: ${err.message}`);
        }
      }
    }
    
    // 2. Check specific schema issues
    console.log('\n🔍 2. SCHEMA VALIDATION:');
    
    // Check users table structure
    console.log('\n👤 Users Table:');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log(`❌ Users error: ${usersError.message}`);
    } else {
      console.log('✅ Users table accessible');
      if (usersData.length > 0) {
        console.log('   Sample columns:', Object.keys(usersData[0]));
      }
    }
    
    // Check clients table structure
    console.log('\n🏢 Clients Table:');
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientsError) {
      console.log(`❌ Clients error: ${clientsError.message}`);
    } else {
      console.log('✅ Clients table accessible');
      console.log(`   Record count: ${clientsData.length}`);
      if (clientsData.length > 0) {
        console.log('   Sample columns:', Object.keys(clientsData[0]));
      }
    }
    
    // Check employees table structure
    console.log('\n👥 Employees Table:');
    const { data: employeesData, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (employeesError) {
      console.log(`❌ Employees error: ${employeesError.message}`);
    } else {
      console.log('✅ Employees table accessible');
      console.log(`   Record count: ${employeesData.length}`);
      if (employeesData.length > 0) {
        console.log('   Sample columns:', Object.keys(employeesData[0]));
      }
    }
    
    // 3. Test INSERT operation
    console.log('\n🧪 3. INSERT OPERATION TEST:');
    
    const testClient = {
      name: 'Test Client DELETE ME',
      email: 'test@delete.com',
      user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
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
      console.log(`❌ Insert test failed: ${insertError.message}`);
      console.log(`   Error code: ${insertError.code}`);
      console.log(`   Details:`, insertError.details);
    } else {
      console.log('✅ Insert test successful');
      console.log('   Inserted record ID:', insertData.id);
      
      // Clean up test record
      await supabase
        .from('clients')
        .delete()
        .eq('id', insertData.id);
      console.log('   Test record cleaned up');
    }
    
    // 4. Check constraints and indexes
    console.log('\n🔒 4. CONSTRAINTS CHECK:');
    
    // Try to insert duplicate to see constraint behavior
    const duplicateTest = {
      name: 'Duplicate Test',
      user_id: '00000000-0000-0000-0000-000000000000',
      currency_id: '1',
      balance: 0,
      is_active: true
    };
    
    // Insert first record
    const { data: first, error: firstError } = await supabase
      .from('clients')
      .insert([duplicateTest])
      .select()
      .single();
    
    if (!firstError && first) {
      // Try to insert duplicate
      const { error: duplicateError } = await supabase
        .from('clients')
        .insert([duplicateTest]);
      
      if (duplicateError) {
        console.log(`✅ Constraint working: ${duplicateError.message}`);
        console.log(`   Error code: ${duplicateError.code}`);
      } else {
        console.log('⚠️  No duplicate constraint found');
      }
      
      // Clean up
      await supabase
        .from('clients')
        .delete()
        .eq('id', first.id);
    }
    
    // 5. Check RLS policies
    console.log('\n🛡️  5. RLS POLICIES CHECK:');
    
    try {
      // This will show if RLS is enabled
      const { data: rls, error: rlsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      
      if (rlsError && rlsError.code === 'PGRST116') {
        console.log('⚠️  RLS might be blocking access');
      } else {
        console.log('✅ RLS policies allow access');
      }
    } catch (err) {
      console.log(`❌ RLS check error: ${err.message}`);
    }
    
    console.log('\n✅ Schema analysis completed!');
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

analyzeSupabaseSchema();
