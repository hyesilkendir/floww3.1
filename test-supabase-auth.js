const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gjxlfeisaeojbgymehgf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeGxmZWlzYWVvamJneW1laGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzE4MTIsImV4cCI6MjA3MzUwNzgxMn0.bMCblgaWnkvzHDf1LwirPMRrSAypjt8EXVxr5a-Y9rE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔵 Supabase Auth Test Started');
  
  try {
    // Test 1: Check existing user
    console.log('\n1. Checking existing user test@example.com...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: '123456'
    });
    
    if (signInData.user) {
      console.log('✅ User exists and login successful');
      console.log('User ID:', signInData.user.id);
      console.log('Email:', signInData.user.email);
      return;
    }
    
    if (signInError) {
      console.log('❌ Login failed:', signInError.message);
      
      // Test 2: Create the user if doesn't exist
      console.log('\n2. Creating new user test@example.com...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: '123456',
        options: {
          data: {
            username: 'admin',
            name: 'Admin User',
            company_name: 'CALAF.CO'
          }
        }
      });
      
      if (signUpError) {
        console.log('❌ Sign up failed:', signUpError.message);
        return;
      }
      
      console.log('✅ User created successfully');
      console.log('User ID:', signUpData.user?.id);
      console.log('Email confirmed:', signUpData.user?.email_confirmed_at);
      
      // Test 3: Try login again
      console.log('\n3. Trying login again...');
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: '123456'
      });
      
      if (retryError) {
        console.log('❌ Retry login failed:', retryError.message);
      } else {
        console.log('✅ Login successful after signup');
      }
    }
    
  } catch (err) {
    console.log('❌ Test failed with error:', err.message);
  }
}

testAuth();