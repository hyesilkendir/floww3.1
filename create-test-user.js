require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createTestUser() {
  console.log('👤 Creating Test User for Database Operations');
  console.log('=============================================');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables missing');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Check if any users exist
    console.log('\n📋 1. CHECKING EXISTING USERS');
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log(`❌ Users check failed: ${usersError.message}`);
      return;
    }
    
    console.log(`✅ Found ${existingUsers.length} existing users`);
    
    if (existingUsers.length > 0) {
      console.log('   Existing user IDs:', existingUsers.map(u => u.id));
      
      // Test with existing user
      const testUserId = existingUsers[0].id;
      console.log(`\n🧪 Testing client insert with existing user: ${testUserId}`);
      
      const testClient = {
        name: 'Test Client WITH VALID USER',
        email: 'valid@test.com',
        user_id: testUserId,
        currency_id: '1',
        balance: 0,
        is_active: true
      };
      
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([testClient])
        .select()
        .single();
      
      if (clientError) {
        console.log(`❌ Client insert failed: ${clientError.message}`);
        console.log(`   Error code: ${clientError.code}`);
      } else {
        console.log('✅ Client insert successful with existing user!');
        console.log('   Client ID:', clientData.id);
        
        // Clean up
        await supabase.from('clients').delete().eq('id', clientData.id);
        console.log('   Test client cleaned up');
      }
      
      return;
    }
    
    // 2. Create a test user if none exist
    console.log('\n👤 2. CREATING TEST USER');
    
    const testUser = {
      id: 'test-user-uuid-12345',
      email: 'testuser@example.com',
      username: 'testuser',
      password: 'hashedpassword123',
      name: 'Test User',
      company_name: 'Test Company',
      is_verified: true
    };
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single();
    
    if (userError) {
      console.log(`❌ User creation failed: ${userError.message}`);
      console.log(`   Error code: ${userError.code}`);
    } else {
      console.log('✅ Test user created successfully!');
      console.log('   User ID:', userData.id);
      
      // 3. Now test client insert with the new user
      console.log('\n🧪 3. TESTING CLIENT INSERT WITH NEW USER');
      
      const testClient = {
        name: 'Test Client WITH NEW USER',
        email: 'newuser@test.com',
        user_id: userData.id,
        currency_id: '1',
        balance: 0,
        is_active: true
      };
      
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([testClient])
        .select()
        .single();
      
      if (clientError) {
        console.log(`❌ Client insert failed: ${clientError.message}`);
        console.log(`   Error code: ${clientError.code}`);
      } else {
        console.log('✅ Client insert successful with new user!');
        console.log('   Client ID:', clientData.id);
        
        // Clean up
        await supabase.from('clients').delete().eq('id', clientData.id);
        console.log('   Test client cleaned up');
      }
    }
    
    console.log('\n✅ Test user creation completed!');
    
  } catch (error) {
    console.error('❌ Test user creation failed:', error.message);
  }
}

createTestUser();
