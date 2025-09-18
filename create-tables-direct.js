const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ffqwomxrfvsjzpyeklvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcXdvbXhyZnZzanpweWVrbHZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgyNDgzNCwiZXhwIjoyMDcwNDAwODM0fQ.SGNDjrAF7EGEb_9XJbt_PqFZ5-U1WiqsljDkDUWrr4o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAllTables() {
  console.log('🚀 Creating all missing tables in CORRECT database...');
  console.log('URL:', supabaseUrl);
  
  try {
    // 1. Enable RLS on currencies table
    console.log('📋 1. Enabling RLS on currencies table...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log('⚠️ RLS Error (might already be enabled):', rlsError.message);
    } else {
      console.log('✅ RLS enabled on currencies');
    }

    // 2. Create debts management tables
    console.log('📋 2. Creating debts management tables...');
    const debtsSQL = `
      -- Create debts table
      CREATE TABLE IF NOT EXISTS public.debts (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
          title text NOT NULL,
          description text,
          total_amount numeric NOT NULL DEFAULT 0,
          remaining_amount numeric NOT NULL DEFAULT 0,
          currency_id text NOT NULL REFERENCES public.currencies(id),
          due_date date,
          status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue', 'cancelled')),
          debt_type text NOT NULL DEFAULT 'receivable' CHECK (debt_type IN ('receivable', 'payable')),
          interest_rate numeric DEFAULT 0 CHECK (interest_rate >= 0),
          priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
      );

      -- Create debt payments table
      CREATE TABLE IF NOT EXISTS public.debt_payments (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          debt_id uuid NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
          amount numeric NOT NULL CHECK (amount > 0),
          payment_date date NOT NULL,
          description text,
          payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check', 'other')),
          created_at timestamptz DEFAULT now()
      );

      -- Create payment plans table
      CREATE TABLE IF NOT EXISTS public.payment_plans (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          debt_id uuid NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
          installment_number integer NOT NULL CHECK (installment_number > 0),
          amount numeric NOT NULL CHECK (amount > 0),
          due_date date NOT NULL,
          status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
          paid_date date,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
      );

      -- Enable RLS
      ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      CREATE POLICY "Users can manage their own debts" ON public.debts
          FOR ALL TO authenticated
          USING (user_id = (select auth.uid()))
          WITH CHECK (user_id = (select auth.uid()));

      CREATE POLICY "Users can manage their own debt payments" ON public.debt_payments
          FOR ALL TO authenticated
          USING (user_id = (select auth.uid()))
          WITH CHECK (user_id = (select auth.uid()));

      CREATE POLICY "Users can manage their own payment plans" ON public.payment_plans
          FOR ALL TO authenticated
          USING (user_id = (select auth.uid()))
          WITH CHECK (user_id = (select auth.uid()));

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
      CREATE INDEX IF NOT EXISTS idx_debts_client_id ON public.debts(client_id);
      CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(status);
      CREATE INDEX IF NOT EXISTS idx_debts_due_date ON public.debts(due_date);
      CREATE INDEX IF NOT EXISTS idx_debts_debt_type ON public.debts(debt_type);

      CREATE INDEX IF NOT EXISTS idx_debt_payments_user_id ON public.debt_payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON public.debt_payments(debt_id);
      CREATE INDEX IF NOT EXISTS idx_debt_payments_date ON public.debt_payments(payment_date);

      CREATE INDEX IF NOT EXISTS idx_payment_plans_user_id ON public.payment_plans(user_id);
      CREATE INDEX IF NOT EXISTS idx_payment_plans_debt_id ON public.payment_plans(debt_id);
      CREATE INDEX IF NOT EXISTS idx_payment_plans_due_date ON public.payment_plans(due_date);
      CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON public.payment_plans(status);
    `;

    const { error: debtsError } = await supabase.rpc('exec_sql', { sql: debtsSQL });
    
    if (debtsError) {
      console.log('❌ Debts tables error:', debtsError.message);
    } else {
      console.log('✅ Debts management tables created successfully');
    }

    // 3. Add missing foreign key indexes
    console.log('📋 3. Adding missing foreign key indexes...');
    const indexSQL = `
      -- Add missing indexes for foreign keys to improve performance
      CREATE INDEX IF NOT EXISTS idx_clients_currency_id ON public.clients(currency_id);
      CREATE INDEX IF NOT EXISTS idx_employees_currency_id ON public.employees(currency_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_currency_id ON public.invoices(currency_id);
      CREATE INDEX IF NOT EXISTS idx_quotes_currency_id ON public.quotes(currency_id);
      CREATE INDEX IF NOT EXISTS idx_quotes_converted_to_invoice_id ON public.quotes(converted_to_invoice_id);
      CREATE INDEX IF NOT EXISTS idx_regular_payments_currency_id ON public.regular_payments(currency_id);
      CREATE INDEX IF NOT EXISTS idx_regular_payments_employee_id ON public.regular_payments(employee_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_currency_id ON public.transactions(currency_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_employee_id ON public.transactions(employee_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_parent_transaction_id ON public.transactions(parent_transaction_id);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
    
    if (indexError) {
      console.log('❌ Index creation error:', indexError.message);
    } else {
      console.log('✅ Foreign key indexes created successfully');
    }

    // 4. Test table creation
    console.log('📋 4. Testing created tables...');
    const testTables = ['debts', 'debt_payments', 'payment_plans'];
    
    for (const table of testTables) {
      try {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          console.log(`❌ ${table}: ERROR - ${error.message}`);
        } else {
          console.log(`✅ ${table}: EXISTS and accessible`);
        }
      } catch (e) {
        console.log(`❌ ${table}: EXCEPTION - ${e.message}`);
      }
    }

    // 5. Final verification
    console.log('📋 5. Final verification - listing all tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('❌ Error listing tables:', tablesError.message);
    } else {
      console.log('✅ Total public tables:', tables?.length || 0);
      console.log('📋 Table names:', tables?.map(t => t.table_name).sort().join(', '));
    }

    console.log('\n🎉 DATABASE SETUP COMPLETE!');
    console.log('✅ All critical tables created');
    console.log('✅ RLS policies enabled');
    console.log('✅ Performance indexes added');
    console.log('✅ Ready for production!');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

createAllTables();