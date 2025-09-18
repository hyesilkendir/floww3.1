/**
 * Enhanced Registration API Endpoint
 * Production-ready user registration with security measures
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ApiResponseBuilder, ApiErrorCode, getHttpStatusFromApiError } from '@/lib/api/response';
import { authSchemas, createValidationMiddleware } from '@/lib/api/validation';
import { withSecurity, rateLimitConfigs } from '@/lib/api/middleware';
import { logger, LogCategory, logSecurityEvent } from '@/lib/api/logger';

async function registerHandler(request: NextRequest) {
  const startTime = Date.now();
  let userData: any = null;

  try {
    // Parse and validate request body
    const body = await request.json();
    
    // Validate input with schema
    const validation = await createValidationMiddleware(authSchemas.register)(body);
    if (!validation.success) {
      return NextResponse.json(validation.response, {
        status: getHttpStatusFromApiError(validation.response.error!)
      });
    }

    const { email, password, username, name, phone } = validation.data;
    const clientIp = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') || 'unknown';

    // Log registration attempt
    logger.info(LogCategory.AUTH, 'Registration attempt', {
      ip: clientIp,
      metadata: {
        email: email.substring(0, 3) + '***',
        username: username.substring(0, 3) + '***'
      }
    });

    // Create Supabase client
    const supabase = await createClient();

    // Note: We'll let Supabase handle duplicate email detection during signUp
    // as the admin getUserByEmail requires service role key which isn't available in browser

    // Attempt user registration
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          name,
          phone: phone || null,
          company_name: 'CALAF.CO',
          created_at: new Date().toISOString()
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`
      }
    });

    if (error) {
      logger.warn(LogCategory.AUTH, 'Registration failed', {
        ip: clientIp,
        metadata: {
          email: email.substring(0, 3) + '***',
          error: error.message
        }
      });

      // Handle specific error cases
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        return NextResponse.json(
          ApiResponseBuilder.error(
            ApiErrorCode.DUPLICATE_ENTRY,
            'Bu e-posta adresi zaten kayıtlı',
            { field: 'email' },
            'email',
            'validation'
          ),
          { status: 409 }
        );
      }

      if (error.message.includes('Password should be')) {
        return NextResponse.json(
          ApiResponseBuilder.error(
            ApiErrorCode.VALIDATION_ERROR,
            'Şifre güvenlik gereksinimlerini karşılamıyor',
            { requirements: 'En az 8 karakter, büyük-küçük harf, rakam ve özel karakter içermelidir' },
            'password',
            'validation'
          ),
          { status: 400 }
        );
      }

      return NextResponse.json(
        ApiResponseBuilder.error(
          ApiErrorCode.VALIDATION_ERROR,
          'Kayıt işlemi başarısız',
          { originalError: error.message },
          undefined,
          'validation'
        ),
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        ApiResponseBuilder.serverError(
          'Kullanıcı oluşturulamadı',
          { timestamp: new Date().toISOString() }
        ),
        { status: 500 }
      );
    }

    userData = data.user;

    // Log successful registration
    logger.info(LogCategory.AUTH, 'Registration successful', {
      userId: data.user.id,
      ip: clientIp,
      duration: Date.now() - startTime,
      metadata: {
        email: email.substring(0, 3) + '***',
        username: username.substring(0, 3) + '***',
        requiresConfirmation: !data.user.email_confirmed_at
      }
    });

    // Return success response
    const successResponse = ApiResponseBuilder.success(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username,
          name: data.user.user_metadata?.name,
          emailConfirmed: data.user.email_confirmed_at !== null,
          createdAt: data.user.created_at
        },
        requiresEmailConfirmation: !data.user.email_confirmed_at
      },
      data.user.email_confirmed_at
        ? 'Kayıt başarılı! Artık giriş yapabilirsiniz.'
        : 'Kayıt başarılı! E-posta doğrulama linkini kontrol edin.'
    );

    return NextResponse.json(successResponse, { status: 201 });

  } catch (error) {
    // Log system error
    logger.error(LogCategory.AUTH, 'Registration system error', error as Error, {
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
export const POST = withSecurity(registerHandler, {
  rateLimit: rateLimitConfigs.auth,
  contentSecurity: {
    maxBodySize: 2048, // 2KB max for registration requests
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
