const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running cash accounts migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src/lib/db/pg-migrations/0021_add_cash_accounts_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying direct execution...');
      
      // Split SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: execError } = await supabase.rpc('exec', {
            sql: statement
          });
          
          if (execError) {
            console.error('❌ Error executing statement:', execError);
            throw execError;
          }
        }
      }
    }
    
    console.log('✅ Cash accounts migration completed successfully!');
    
    // Test the table creation
    const { data: testData, error: testError } = await supabase
      .from('cash_accounts')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing cash_accounts table:', testError);
    } else {
      console.log('✅ cash_accounts table is accessible');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative: Manual SQL execution
async function runMigrationManual() {
  try {
    console.log('🚀 Running cash accounts migration manually...');
    
    // Create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS cash_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          currency_id TEXT NOT NULL DEFAULT '1',
          balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
          is_default BOOLEAN NOT NULL DEFAULT false,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          CONSTRAINT cash_accounts_name_user_unique UNIQUE(user_id, name),
          CONSTRAINT cash_accounts_balance_check CHECK (balance >= 0)
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec', {
      sql: createTableSQL
    });
    
    if (createError) {
      console.error('❌ Error creating table:', createError);
      throw createError;
    }
    
    console.log('✅ cash_accounts table created');
    
    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log('⚠️  RLS enable error (might already be enabled):', rlsError.message);
    }
    
    // Create RLS policies
    const policies = [
      `CREATE POLICY "Users can view their own cash accounts" ON cash_accounts FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert their own cash accounts" ON cash_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update their own cash accounts" ON cash_accounts FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete their own cash accounts" ON cash_accounts FOR DELETE USING (auth.uid() = user_id);`
    ];
    
    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec', {
        sql: policy
      });
      
      if (policyError) {
        console.log('⚠️  Policy error (might already exist):', policyError.message);
      }
    }
    
    console.log('✅ RLS policies created');
    
    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('cash_accounts')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing cash_accounts table:', testError);
    } else {
      console.log('✅ cash_accounts table is working correctly');
    }
    
  } catch (error) {
    console.error('❌ Manual migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (process.argv.includes('--manual')) {
  runMigrationManual();
} else {
  runMigration();
}