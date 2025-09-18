const { Client } = require('pg');

// Direct PostgreSQL connection
const client = new Client({
  connectionString: 'postgresql://postgres.ffqwomxrfvsjzpyeklvm:Halil08780@aws-0-us-east-2.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createAllTables() {
  console.log('🚀 Creating all tables via direct PostgreSQL connection...');
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    // 1. Create currencies table first
    console.log('📋 1. Creating currencies table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.currencies (
          id text PRIMARY KEY,
          code text UNIQUE NOT NULL,
          name text NOT NULL,
          symbol text NOT NULL,
          is_active boolean DEFAULT true,
          created_at timestamptz DEFAULT now()
      );
    `);
    console.log('✅ Currencies table created');

    // 2. Insert default currencies
    console.log('📋 2. Inserting default currencies...');
    await client.query(`
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
    `);
    console.log('✅ Default currencies inserted');

    // 3. Create transaction_type enum
    console.log('📋 3. Creating enums...');
    await client.query(`
      DO $$ BEGIN
          CREATE TYPE transaction_type AS ENUM ('income', 'expense');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
          CREATE TYPE payroll_period AS ENUM ('monthly', 'weekly', 'biweekly');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Enums created');

    // 4. Create categories table
    console.log('📋 4. Creating categories table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.categories (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          type transaction_type NOT NULL,
          color text DEFAULT '#6b7280',
          icon text,
          is_default boolean DEFAULT false,
          user_id uuid NOT NULL,
          created_at timestamptz DEFAULT now()
      );
    `);
    console.log('✅ Categories table created');

    // 5. Create clients table
    console.log('📋 5. Creating clients table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.clients (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          email text,
          phone text,
          address text,
          tax_number text,
          contact_person text,
          contract_start_date date,
          contract_end_date date,
          currency_id text NOT NULL REFERENCES public.currencies(id),
          balance numeric DEFAULT 0,
          is_active boolean DEFAULT true,
          user_id uuid NOT NULL,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
      );
    `);
    console.log('✅ Clients table created');

    // 6. Create employees table
    console.log('📋 6. Creating employees table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.employees (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          position text NOT NULL,
          net_salary numeric NOT NULL,
          currency_id text NOT NULL REFERENCES public.currencies(id),
          payroll_period payroll_period NOT NULL,
          payment_day integer NOT NULL,
          is_active boolean DEFAULT true,
          user_id uuid NOT NULL,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
      );
    `);
    console.log('✅ Employees table created');

    // 7. Create transactions table
    console.log('📋 7. Creating transactions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.transactions (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          type transaction_type NOT NULL,
          amount numeric NOT NULL,
          description text NOT NULL,
          category_id uuid REFERENCES public.categories(id),
          client_id uuid REFERENCES public.clients(id),
          employee_id uuid REFERENCES public.employees(id),
          currency_id text NOT NULL REFERENCES public.currencies(id),
          transaction_date date NOT NULL,
          is_vat_included boolean DEFAULT false,
          vat_rate numeric DEFAULT 0,
          is_recurring boolean DEFAULT false,
          recurring_period text,
          next_recurring_date date,
          parent_transaction_id uuid REFERENCES public.transactions(id),
          user_id uuid NOT NULL,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
      );
    `);
    console.log('✅ Transactions table created');

    // 8. Create invoices table
    console.log('📋 8. Creating invoices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.invoices (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id uuid NOT NULL,
          client_id uuid REFERENCES public.clients(id),
          currency_id text NOT NULL REFERENCES public.currencies(id),
          issue_date date NOT NULL,
          due_date date NOT NULL,
          description text,
          items jsonb,
          invoice_number text,
          net_amount numeric DEFAULT 0,
          vat_rate numeric DEFAULT 0,
          total_amount numeric DEFAULT 0,
          paid_amount numeric DEFAULT 0,
          remaining_amount numeric DEFAULT 0,
          status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
          is_recurring boolean DEFAULT false,
          recurring_months integer,
          withholding_tax_rate numeric DEFAULT 0,
          withholding_tax_amount numeric DEFAULT 0,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
      );
    `);
    console.log('✅ Invoices table created');

    // 9. Create quotes table
    console.log('📋 9. Creating quotes table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.quotes (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id uuid NOT NULL,
          client_id uuid REFERENCES public.clients(id),
          currency_id text NOT NULL REFERENCES public.currencies(id),
          issue_date date NOT NULL,
          valid_until date NOT NULL,
          description text,
          items jsonb,
          quote_number text,
          net_amount numeric DEFAULT 0,
          vat_rate numeric DEFAULT 0,
          total_amount numeric DEFAULT 0,
          status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'converted')),
          withholding_tax_rate numeric DEFAULT 0,
          withholding_tax_amount numeric DEFAULT 0,
          converted_to_invoice_id uuid REFERENCES public.invoices(id),
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
      );
    `);
    console.log('✅ Quotes table created');

    // 10. Create debts management tables
    console.log('📋 10. Creating debts management tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.debts (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id uuid NOT NULL,
          client_id uuid REFERENCES public.clients(id),
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

      CREATE TABLE IF NOT EXISTS public.debt_payments (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id uuid NOT NULL,
          debt_id uuid NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
          amount numeric NOT NULL CHECK (amount > 0),
          payment_date date NOT NULL,
          description text,
          payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check', 'other')),
          created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.payment_plans (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id uuid NOT NULL,
          debt_id uuid NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
          installment_number integer NOT NULL CHECK (installment_number > 0),
          amount numeric NOT NULL CHECK (amount > 0),
          due_date date NOT NULL,
          status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
          paid_date date,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
      );
    `);
    console.log('✅ Debts management tables created');

    // 11. Create company_settings table
    console.log('📋 11. Creating company_settings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.company_settings (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id uuid NOT NULL UNIQUE,
          company_name text NOT NULL,
          address text,
          phone text,
          email text,
          website text,
          tax_number text,
          light_mode_logo_url text,
          dark_mode_logo_url text,
          quote_logo_url text,
          default_withholding_tax_rate numeric DEFAULT 0,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
      );
    `);
    console.log('✅ Company settings table created');

    // 12. Create regular_payments table
    console.log('📋 12. Creating regular_payments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.regular_payments (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id uuid NOT NULL,
          title text NOT NULL,
          amount numeric DEFAULT 0,
          currency_id text NOT NULL REFERENCES public.currencies(id),
          due_date date NOT NULL,
          frequency text NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
          category text NOT NULL CHECK (category IN ('loan', 'installment', 'rent', 'utilities', 'food', 'insurance', 'other')),
          status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
          description text,
          employee_id uuid REFERENCES public.employees(id),
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
      );
    `);
    console.log('✅ Regular payments table created');

    // 13. Create indexes for performance
    console.log('📋 13. Creating performance indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);',
      'CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_clients_currency_id ON public.clients(currency_id);',
      'CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_employees_currency_id ON public.employees(currency_id);',
      'CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_transactions_currency_id ON public.transactions(currency_id);',
      'CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);',
      'CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_invoices_currency_id ON public.invoices(currency_id);',
      'CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_quotes_currency_id ON public.quotes(currency_id);',
      'CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_debts_currency_id ON public.debts(currency_id);',
      'CREATE INDEX IF NOT EXISTS idx_debt_payments_user_id ON public.debt_payments(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON public.debt_payments(debt_id);',
      'CREATE INDEX IF NOT EXISTS idx_payment_plans_user_id ON public.payment_plans(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_payment_plans_debt_id ON public.payment_plans(debt_id);',
      'CREATE INDEX IF NOT EXISTS idx_regular_payments_user_id ON public.regular_payments(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_regular_payments_currency_id ON public.regular_payments(currency_id);'
    ];

    for (const indexSQL of indexes) {
      await client.query(indexSQL);
    }
    console.log('✅ Performance indexes created');

    // 14. Test all tables
    console.log('📋 14. Testing all created tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('✅ Total tables created:', result.rows.length);
    console.log('📋 Table names:', result.rows.map(r => r.table_name).join(', '));

    console.log('\n🎉 DATABASE SETUP COMPLETE!');
    console.log('✅ All critical tables created successfully');
    console.log('✅ Default currencies inserted');
    console.log('✅ Performance indexes added');
    console.log('✅ Database is ready for production!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

createAllTables();