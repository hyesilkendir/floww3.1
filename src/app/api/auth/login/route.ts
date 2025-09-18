/**
 * Enhanced Login API Endpoint
 * Production-ready authentication with security measures
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ApiResponseBuilder, ApiErrorCode, getHttpStatusFromApiError } from '@/lib/api/response';
import { authSchemas, createValidationMiddleware, InputSanitizer } from '@/lib/api/validation';
import { withSecurity, rateLimitConfigs } from '@/lib/api/middleware';
import { logger, LogCategory, logSecurityEvent } from '@/lib/api/logger';

async function loginHandler(request: NextRequest) {
  const startTime = Date.now();
  let userData: any = null;

  try {
    // Parse and validate request body
    const body = await request.json();
    
    // Validate input with schema
    const validation = await createValidationMiddleware(authSchemas.login)(body);
    if (!validation.success) {
      return NextResponse.json(validation.response, { 
        status: getHttpStatusFromApiError(validation.response.error!) 
      });
    }

    const { email, password } = validation.data;
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 'unknown';

    // Log login attempt
    logSecurityEvent('login_attempt', request, {
      email: email.substring(0, 3) + '***', // Partial email for privacy
      timestamp: new Date().toISOString()
    }, 'low');

    // Create Supabase client
    const supabase = await createClient();

    // Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Log failed login
      logSecurityEvent('login_failure', request, {
        email: email.substring(0, 3) + '***',
        errorMessage: error.message,
        timestamp: new Date().toISOString()
      }, 'medium');

      logger.warn(LogCategory.AUTH, 'Login failed', {
        ip: clientIp,
        email: email.substring(0, 3) + '***',
        error: error.message,
        duration: Date.now() - startTime
      });

      // Return standardized error responses
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          ApiResponseBuilder.error(
            ApiErrorCode.INVALID_CREDENTIALS,
            'E-posta veya şifre hatalı',
            { attempt: 'login' },
            undefined,
            'authentication'
          ),
          { status: 401 }
        );
      }

      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          ApiResponseBuilder.error(
            ApiErrorCode.UNAUTHORIZED,
            'E-posta adresinizi doğrulamanız gerekiyor',
            { needsConfirmation: true },
            undefined,
            'authentication'
          ),
          { status: 401 }
        );
      }

      return NextResponse.json(
        ApiResponseBuilder.error(
          ApiErrorCode.UNAUTHORIZED,
          'Giriş başarısız',
          { originalError: error.message },
          undefined,
          'authentication'
        ),
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          ApiErrorCode.UNAUTHORIZED,
          'Kullanıcı bilgileri alınamadı',
          undefined,
          undefined,
          'authentication'
        ),
        { status: 401 }
      );
    }

    userData = data.user;

    // Log successful login
    logSecurityEvent('login_success', request, {
      userId: data.user.id,
      email: email.substring(0, 3) + '***',
      timestamp: new Date().toISOString()
    }, 'low');

    logger.info(LogCategory.AUTH, 'Login successful', {
      userId: data.user.id,
      ip: clientIp,
      duration: Date.now() - startTime,
      metadata: {
        email: email.substring(0, 3) + '***'
      }
    });

    // Return success response with user data
    const successResponse = ApiResponseBuilder.success(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username,
          name: data.user.user_metadata?.name,
          emailConfirmed: data.user.email_confirmed_at !== null,
          lastSignInAt: data.user.last_sign_in_at
        },
        session: {
          accessToken: data.session?.access_token ? '***' : null, // Don't expose token
          refreshToken: data.session?.refresh_token ? '***' : null, // Don't expose token
          expiresAt: data.session?.expires_at,
          expiresIn: data.session?.expires_in
        }
      },
      'Giriş başarılı'
    );

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error) {
    // Log system error
    logger.error(LogCategory.AUTH, 'Login system error', error as Error, {
      userId: userData?.id,
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

// Apply security middleware with auth-specific rate limiting
export const POST = withSecurity(loginHandler, {
  rateLimit: rateLimitConfigs.auth,
  contentSecurity: {
    maxBodySize: 1024, // 1KB max for login requests
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