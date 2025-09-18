/**
 * Enhanced Invoice API Endpoints
 * Production-ready invoice CRUD operations with security measures
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ApiResponseBuilder, ApiErrorCode, getHttpStatusFromApiError } from '@/lib/api/response';
import { entitySchemas, commonSchemas, createValidationMiddleware } from '@/lib/api/validation';
import { withSecurity, rateLimitConfigs } from '@/lib/api/middleware';
import { logger, LogCategory } from '@/lib/api/logger';
import { z } from 'zod';

// Invoice creation schema
const createInvoiceSchema = z.object({
  clientId: commonSchemas.id,
  amount: commonSchemas.amount,
  taxAmount: commonSchemas.amount.optional(),
  currency: commonSchemas.currency,
  dueDate: commonSchemas.date,
  description: commonSchemas.description,
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description required').max(200),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: commonSchemas.amount,
    taxRate: commonSchemas.taxRate.optional().default(0)
  })).min(1, 'At least one item required')
});

// Invoice update schema
const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  id: commonSchemas.id
});

// Pagination schema
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  clientId: commonSchemas.id.optional()
});

/**
 * GET /api/invoices - List invoices with pagination and filtering
 */
async function getInvoicesHandler(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    // Create Supabase client and verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        ApiResponseBuilder.authenticationError('Oturum gerekli'),
        { status: 401 }
      );
    }

    userId = user.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = await createValidationMiddleware(paginationSchema)({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      clientId: searchParams.get('clientId')
    });

    if (!queryValidation.success) {
      return NextResponse.json(queryValidation.response, { 
        status: getHttpStatusFromApiError(queryValidation.response.error!) 
      });
    }

    const { page, limit, search, status, clientId } = queryValidation.data;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        clients(id, name, email),
        invoice_items(*)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,invoice_number.ilike.%${search}%`);
    }

    const { data: invoices, error, count } = await query;

    if (error) {
      logger.error(LogCategory.DATABASE, 'Failed to fetch invoices', new Error(error.message), {
        userId,
        duration: Date.now() - startTime,
        metadata: {
          operation: 'fetch_invoices'
        }
      });

      return NextResponse.json(
        ApiResponseBuilder.databaseError('fetch invoices', { error: error.message }),
        { status: 500 }
      );
    }

    // Log successful operation
    logger.info(LogCategory.API, 'Invoices fetched successfully', {
      userId,
      duration: Date.now() - startTime,
      metadata: {
        count: invoices?.length || 0,
        totalCount: count,
        page,
        limit
      }
    });

    const response = ApiResponseBuilder.success(
      invoices || [],
      'Faturalar başarıyla getirildi',
      {
        page,
        limit,
        total: count || 0,
        hasMore: count ? offset + limit < count : false
      }
    );

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    logger.error(LogCategory.API, 'Invoice fetch system error', error as Error, {
      userId,
      duration: Date.now() - startTime
    });

    return NextResponse.json(
      ApiResponseBuilder.serverError('Sistem hatası oluştu'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices - Create new invoice
 */
async function createInvoiceHandler(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    console.log('🔍 DEBUG: API createInvoiceHandler başladı');
    
    // Create Supabase client and verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('🔍 DEBUG: Authentication failed:', authError);
      return NextResponse.json(
        ApiResponseBuilder.authenticationError('Oturum gerekli'),
        { status: 401 }
      );
    }

    userId = user.id;
    console.log('🔍 DEBUG: User authenticated:', userId);

    // Parse and validate request body
    const body = await request.json();
    console.log('🔍 DEBUG: Request body:', body);
    
    const validation = await createValidationMiddleware(createInvoiceSchema)(body);
    console.log('🔍 DEBUG: Validation result:', validation);
    
    if (!validation.success) {
      return NextResponse.json(validation.response, { 
        status: getHttpStatusFromApiError(validation.response.error!) 
      });
    }

    const { clientId, amount, taxAmount, currency, dueDate, description, status, items } = validation.data;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalTax = items.reduce((sum, item) => {
      const itemTax = (item.quantity * item.unitPrice) * (item.taxRate || 0) / 100;
      return sum + itemTax;
    }, 0);
    const total = subtotal + totalTax;

    // Verify client belongs to user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        ApiResponseBuilder.notFoundError('Client', clientId),
        { status: 404 }
      );
    }

    // Create invoice in database transaction
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        client_id: clientId,
        invoice_number: invoiceNumber,
        amount: total,
        tax_amount: totalTax,
        currency,
        due_date: dueDate,
        description,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (invoiceError) {
      logger.error(LogCategory.DATABASE, 'Failed to create invoice', new Error(invoiceError.message), {
        userId,
        duration: Date.now() - startTime,
        metadata: {
          operation: 'create_invoice'
        }
      });

      return NextResponse.json(
        ApiResponseBuilder.databaseError('create invoice', { error: invoiceError.message }),
        { status: 500 }
      );
    }

    // Create invoice items
    const invoiceItems = items.map(item => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate || 0,
      total: item.quantity * item.unitPrice
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      // Rollback invoice creation
      await supabase.from('invoices').delete().eq('id', invoice.id);
      
      logger.error(LogCategory.DATABASE, 'Failed to create invoice items', new Error(itemsError.message), {
        userId,
        duration: Date.now() - startTime,
        metadata: {
          invoiceId: invoice.id,
          operation: 'create_invoice_items'
        }
      });

      return NextResponse.json(
        ApiResponseBuilder.databaseError('create invoice items', { error: itemsError.message }),
        { status: 500 }
      );
    }

    // Log successful creation
    logger.info(LogCategory.BUSINESS, 'Invoice created successfully', {
      userId,
      duration: Date.now() - startTime,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber,
        amount: total,
        currency,
        clientId,
        itemCount: items.length
      }
    });

    const response = ApiResponseBuilder.success(
      {
        ...invoice,
        items: invoiceItems,
        subtotal,
        totalTax,
        total
      },
      'Fatura başarıyla oluşturuldu'
    );

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    logger.error(LogCategory.API, 'Invoice creation system error', error as Error, {
      userId,
      duration: Date.now() - startTime
    });

    return NextResponse.json(
      ApiResponseBuilder.serverError('Sistem hatası oluştu'),
      { status: 500 }
    );
  }
}

// Apply security middleware
export const GET = withSecurity(getInvoicesHandler, {
  rateLimit: rateLimitConfigs.api,
  contentSecurity: {
    maxBodySize: 0, // No body for GET requests
    allowedContentTypes: []
  }
});

export const POST = withSecurity(createInvoiceHandler, {
  rateLimit: rateLimitConfigs.api,
  contentSecurity: {
    maxBodySize: 50 * 1024, // 50KB max for invoice creation
    allowedContentTypes: ['application/json']
  }
});

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}