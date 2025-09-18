import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get regular payments for user
    const { data: regularPayments, error } = await supabase
      .from('regular_payments')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Get regular payments error:', error);
      return NextResponse.json({ error: 'Failed to fetch regular payments' }, { status: 500 });
    }

    return NextResponse.json({ regularPayments });
  } catch (error) {
    console.error('Regular payments API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.amount || !body.due_date || !body.frequency || !body.category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert new regular payment
    const { data: newPayment, error } = await supabase
      .from('regular_payments')
      .insert([{
        ...body,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Create regular payment error:', error);
      return NextResponse.json({ error: 'Failed to create regular payment' }, { status: 500 });
    }

    return NextResponse.json({ regularPayment: newPayment }, { status: 201 });
  } catch (error) {
    console.error('Regular payments POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Update regular payment
    const { data: updatedPayment, error } = await supabase
      .from('regular_payments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update regular payment error:', error);
      return NextResponse.json({ error: 'Failed to update regular payment' }, { status: 500 });
    }

    return NextResponse.json({ regularPayment: updatedPayment });
  } catch (error) {
    console.error('Regular payments PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Delete regular payment
    const { error } = await supabase
      .from('regular_payments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete regular payment error:', error);
      return NextResponse.json({ error: 'Failed to delete regular payment' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Regular payment deleted successfully' });
  } catch (error) {
    console.error('Regular payments DELETE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}