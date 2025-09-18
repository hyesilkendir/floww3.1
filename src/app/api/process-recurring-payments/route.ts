import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// This endpoint will be called by a cron job or scheduled task
// to process all due recurring payments
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // For security, this endpoint should only be called by authorized sources
    // You can add API key validation here if needed
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token';
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Processing recurring payments...');

    // Call the PostgreSQL function to process recurring payments
    const { data, error } = await supabase.rpc('process_recurring_payments');

    if (error) {
      console.error('Error processing recurring payments:', error);
      return NextResponse.json({ 
        error: 'Failed to process recurring payments',
        details: error.message 
      }, { status: 500 });
    }

    const result = data?.[0] || { processed_count: 0, created_transactions: 0 };

    console.log(`✅ Processed ${result.processed_count} payments, created ${result.created_transactions} transactions`);

    return NextResponse.json({
      success: true,
      processed_count: result.processed_count,
      created_transactions: result.created_transactions,
      message: `Successfully processed ${result.processed_count} recurring payments`
    });

  } catch (error) {
    console.error('Recurring payments processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check which payments are due for processing
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get all due recurring payments without processing them
    const { data: duePayments, error } = await supabase
      .from('regular_payments')
      .select(`
        id,
        title,
        amount,
        currency,
        frequency,
        due_date,
        next_due_date,
        last_processed_date,
        is_active
      `)
      .eq('is_active', true)
      .or('next_due_date.is.null,next_due_date.lte.now()')
      .or('last_processed_date.is.null,last_processed_date.lt.due_date');

    if (error) {
      console.error('Error fetching due payments:', error);
      return NextResponse.json({ error: 'Failed to fetch due payments' }, { status: 500 });
    }

    return NextResponse.json({
      due_payments: duePayments || [],
      count: duePayments?.length || 0,
      message: `Found ${duePayments?.length || 0} payments due for processing`
    });

  } catch (error) {
    console.error('Get due payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}