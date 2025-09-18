/**
 * Enhanced Logout API Endpoint
 * Production-ready logout with security measures
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ApiResponseBuilder, ApiErrorCode } from '@/lib/api/response';
import { withSecurity, rateLimitConfigs } from '@/lib/api/middleware';
import { logger, LogCategory, logSecurityEvent } from '@/lib/api/logger';

async function logoutHandler(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 'unknown';

    // Create Supabase client
    const supabase = await createClient();

    // Get current user before logout
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      logger.warn(LogCategory.AUTH, 'Logout attempt without valid session', {
        ip: clientIp,
        metadata: {
          error: userError.message
        }
      });

      return NextResponse.json(
        ApiResponseBuilder.error(
          ApiErrorCode.UNAUTHORIZED,
          'Geçersiz oturum',
          undefined,
          undefined,
          'authentication'
        ),
        { status: 401 }
      );
    }

    userId = user?.id;

    // Perform logout
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error(LogCategory.AUTH, 'Logout failed', new Error(error.message), {
        userId,
        ip: clientIp,
        duration: Date.now() - startTime
      });

      return NextResponse.json(
        ApiResponseBuilder.error(
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          'Çıkış işlemi başarısız',
          { originalError: error.message },
          undefined,
          'server_error'
        ),
        { status: 500 }
      );
    }

    // Log successful logout
    logSecurityEvent('logout', request, {
      userId: userId || 'unknown',
      timestamp: new Date().toISOString()
    }, 'low', userId);

    logger.info(LogCategory.AUTH, 'Logout successful', {
      userId,
      ip: clientIp,
      duration: Date.now() - startTime
    });

    // Return success response
    const successResponse = ApiResponseBuilder.success(
      { loggedOut: true, timestamp: new Date().toISOString() },
      'Başarıyla çıkış yaptınız'
    );

    // Create response with cleared cookies
    const response = NextResponse.json(successResponse, { status: 200 });
    
    // Clear auth cookies
    response.cookies.delete('supabase-auth-token');
    response.cookies.delete('supabase.auth.token');
    
    return response;

  } catch (error) {
    // Log system error
    logger.error(LogCategory.AUTH, 'Logout system error', error as Error, {
      userId,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      duration: Date.now() - startTime
    });

    const errorResponse = ApiResponseBuilder.serverError(
      'Sistem hatası oluştu',
      { timestamp: new Date().toISOString() }
    );

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Apply security middleware
export const POST = withSecurity(logoutHandler, {
  rateLimit: rateLimitConfigs.api, // Normal API rate limit for logout
  contentSecurity: {
    maxBodySize: 512, // Very small body for logout
    allowedContentTypes: ['application/json']
  }
});

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}