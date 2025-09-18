/**
 * Production-ready Security Middleware
 * Rate limiting, CORS, CSRF protection, and security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, ApiErrorCode, getHttpStatusFromApiError } from './response';
import { logger, LogCategory, logSecurityEvent } from './logger';

// Rate limiting store (in production, use Redis)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Security configuration
export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  };
  cors: {
    origin: string | string[] | boolean;
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
  csrf: {
    enabled: boolean;
    tokenHeader: string;
    cookieName: string;
  };
  contentSecurity: {
    maxBodySize: number;
    allowedContentTypes: string[];
  };
}

const defaultSecurityConfig: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-Request-ID'
    ],
    credentials: true
  },
  csrf: {
    enabled: process.env.NODE_ENV === 'production',
    tokenHeader: 'X-CSRF-Token',
    cookieName: 'csrf-token'
  },
  contentSecurity: {
    maxBodySize: 10 * 1024 * 1024, // 10MB
    allowedContentTypes: [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain'
    ]
  }
};

class SecurityMiddleware {
  public config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultSecurityConfig, ...config };
  }

  /**
   * Rate limiting middleware
   */
  rateLimit(identifier: string, config?: Partial<SecurityConfig['rateLimit']>): boolean {
    const rateLimitConfig = { ...this.config.rateLimit, ...config };
    const now = Date.now();
    const windowStart = now - rateLimitConfig.windowMs;

    // Clean up old entries
    rateLimitStore.forEach((entry, key) => {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    });

    const entry = rateLimitStore.get(identifier);

    if (!entry) {
      // First request in window
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + rateLimitConfig.windowMs
      });
      return true;
    }

    if (entry.resetTime < now) {
      // Window has expired, reset
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + rateLimitConfig.windowMs
      });
      return true;
    }

    if (entry.count >= rateLimitConfig.max) {
      // Rate limit exceeded
      return false;
    }

    // Increment counter
    entry.count++;
    return true;
  }

  /**
   * CORS middleware
   */
  applyCors(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin');
    const { cors } = this.config;

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const preflightResponse = new NextResponse(null, { status: 204 });
      
      if (this.isOriginAllowed(origin, cors.origin)) {
        preflightResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
      }
      
      preflightResponse.headers.set('Access-Control-Allow-Methods', cors.methods.join(', '));
      preflightResponse.headers.set('Access-Control-Allow-Headers', cors.allowedHeaders.join(', '));
      
      if (cors.credentials) {
        preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      preflightResponse.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
      
      return preflightResponse;
    }

    // Apply CORS headers to actual requests
    if (this.isOriginAllowed(origin, cors.origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    }

    if (cors.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  private isOriginAllowed(origin: string | null, allowed: string | string[] | boolean): boolean {
    if (!origin) return false;
    if (allowed === true) return true;
    if (allowed === false) return false;
    if (typeof allowed === 'string') return origin === allowed;
    if (Array.isArray(allowed)) return allowed.includes(origin);
    return false;
  }

  /**
   * Security headers middleware
   */
  applySecurityHeaders(response: NextResponse): NextResponse {
    // Prevent XSS attacks
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // HTTPS enforcement
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'"
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);
    
    // Remove server information
    response.headers.delete('Server');
    response.headers.delete('X-Powered-By');

    return response;
  }

  /**
   * CSRF protection middleware
   */
  async validateCsrfToken(request: NextRequest): Promise<boolean> {
    if (!this.config.csrf.enabled) return true;
    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
      return true;
    }

    const token = request.headers.get(this.config.csrf.tokenHeader);
    const cookieToken = request.cookies.get(this.config.csrf.cookieName)?.value;

    if (!token || !cookieToken || token !== cookieToken) {
      return false;
    }

    return true;
  }

  /**
   * Content validation middleware
   */
  async validateContent(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
    const contentType = request.headers.get('content-type');
    const contentLength = request.headers.get('content-length');

    // Check content type
    if (contentType && !this.config.contentSecurity.allowedContentTypes.some(
      allowed => contentType.includes(allowed)
    )) {
      return { valid: false, error: 'Unsupported content type' };
    }

    // Check content length
    if (contentLength && parseInt(contentLength) > this.config.contentSecurity.maxBodySize) {
      return { valid: false, error: 'Request body too large' };
    }

    return { valid: true };
  }

  /**
   * Request sanitization
   */
  sanitizeRequest(request: NextRequest): NextRequest {
    // Remove potentially dangerous headers
    const dangerousHeaders = [
      'x-forwarded-host',
      'x-forwarded-server',
      'x-forwarded-proto'
    ];

    // Note: NextRequest headers are read-only, so we log suspicious headers instead
    dangerousHeaders.forEach(header => {
      if (request.headers.get(header)) {
        logger.warn(LogCategory.SECURITY, `Suspicious header detected: ${header}`, {
          ip: this.getClientIp(request),
          userAgent: request.headers.get('user-agent') || undefined,
          url: request.url
        });
      }
    });

    return request;
  }

  /**
   * Get client IP address
   */
  getClientIp(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
           'unknown';
  }

  /**
   * Generate request ID
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * API Route wrapper with security middleware
 */
export function withSecurity(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config?: Partial<SecurityConfig>
) {
  const security = new SecurityMiddleware(config);

  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = security.generateRequestId();
    const clientIp = security.getClientIp(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    try {
      // Sanitize request
      const sanitizedRequest = security.sanitizeRequest(request);

      // Rate limiting
      const rateLimitKey = `${clientIp}:${request.url}`;
      if (!security.rateLimit(rateLimitKey)) {
        logSecurityEvent('rate_limit_exceeded', request, {
          endpoint: request.url,
          method: request.method
        }, 'medium');

        const errorResponse = ApiResponseBuilder.rateLimitError(
          security.config.rateLimit.max,
          security.config.rateLimit.windowMs
        );

        return NextResponse.json(errorResponse, { 
          status: getHttpStatusFromApiError(errorResponse.error!) 
        });
      }

      // Content validation
      const contentValidation = await security.validateContent(sanitizedRequest);
      if (!contentValidation.valid) {
        const errorResponse = ApiResponseBuilder.error(
          ApiErrorCode.VALIDATION_ERROR,
          contentValidation.error!,
          undefined,
          undefined,
          'bad_request'
        );

        return NextResponse.json(errorResponse, { status: 400 });
      }

      // CSRF validation
      const csrfValid = await security.validateCsrfToken(sanitizedRequest);
      if (!csrfValid) {
        logSecurityEvent('suspicious_activity', request, {
          reason: 'CSRF token validation failed',
          endpoint: request.url
        }, 'high');

        const errorResponse = ApiResponseBuilder.error(
          ApiErrorCode.FORBIDDEN,
          'CSRF token validation failed',
          undefined,
          undefined,
          'authorization'
        );

        return NextResponse.json(errorResponse, { status: 403 });
      }

      // Execute handler
      let response = await handler(sanitizedRequest, context);

      // Apply security measures to response
      response = security.applyCors(sanitizedRequest, response);
      response = security.applySecurityHeaders(response);

      // Add request ID to response
      response.headers.set('X-Request-ID', requestId);

      // Log successful request
      const duration = Date.now() - startTime;
      logger.logApiRequest(
        request.method,
        request.url,
        response.status,
        duration,
        requestId,
        undefined, // userId can be extracted from request context
        clientIp,
        userAgent
      );

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(LogCategory.API, 'API request failed', error as Error, {
        method: request.method,
        url: request.url,
        requestId,
        ip: clientIp,
        userAgent,
        duration
      });

      const errorResponse = ApiResponseBuilder.serverError(
        'Internal server error',
        { requestId }
      );

      let response = NextResponse.json(errorResponse, { status: 500 });
      
      // Apply security headers even to error responses
      response = security.applySecurityHeaders(response);
      response.headers.set('X-Request-ID', requestId);

      return response;
    }
  };
}

// Specific rate limit configurations for different endpoints
export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 login attempts per window
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 API calls per window
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10 // 10 uploads per hour
  },
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20 // 20 sensitive operations per hour
  }
};

export { SecurityMiddleware };