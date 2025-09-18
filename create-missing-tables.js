const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ffqwomxrfvsjzpyeklvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcXdvbXhyZnZzanpweWVrbHZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgyNDgzNCwiZXhwIjoyMDcwNDAwODM0fQ.SGNDjrAF7EGEb_9XJbt_PqFZ5-U1WiqsljDkDUWrr4o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingTables() {
  console.log('🚀 Creating missing tables in correct Supabase database...');
  
  try {
    // 1. Create currencies table first (referenced by other tables)
    console.log('📋 Creating currencies table...');
    const { error: currenciesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.currencies (
          id TEXT PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          symbol TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Insert default currencies
        INSERT INTO public.currencies (id, code, name, symbol) VALUES
        ('1', 'TRY', 'Türk Lirası', '₺'),
        ('2', 'USD', 'US Dollar', '$'),
        ('3', 'EUR', 'Euro', '€'),
        ('4', 'GBP', 'British Pound', '£')
        ON CONFLICT (code) DO NOTHING;
        
        -- Enable RLS
        ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Public read access" ON public.currencies FOR SELECT USING (true);
      `
    });
    
    if (currenciesError) {
      console.error('❌ Currencies table error:', currenciesError);
    } else {
      console.log('✅ Currencies table created');
    }

    // 2. Create categories table
    console.log('📋 Creating categories table...');
    const { error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TYPE transaction_type AS ENUM ('income', 'expense');
        
        CREATE TABLE IF NOT EXISTS public.categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          type transaction_type NOT NULL,
          color TEXT DEFAULT '#6b7280',
          icon TEXT,
          is_default BOOLEAN DEFAULT false,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can manage their own categories" ON public.categories
          FOR ALL USING (auth.uid() = user_id);
      `
    });
    
    if (categoriesError) {
      console.error('❌ Categories table error:', categoriesError);
    } else {
      console.log('✅ Categories table created');
    }

    console.log('🎉 Basic tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

createMissingTables();