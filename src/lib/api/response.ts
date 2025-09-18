/**
 * Standardized API Response Types and Utilities
 * Production-ready response formatting with consistent error handling
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
  requestId: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  type: 'validation' | 'authentication' | 'authorization' | 'not_found' | 'server_error' | 'rate_limit' | 'bad_request';
}

export enum ApiErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Authorization errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY'
}

export class ApiResponseBuilder {
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  static success<T>(data: T, message?: string, meta?: any): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      meta,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }

  static error(
    code: ApiErrorCode | string,
    message: string,
    details?: any,
    field?: string,
    type: ApiError['type'] = 'server_error'
  ): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        field,
        type
      },
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }

  static validationError(field: string, message: string, details?: any): ApiResponse {
    return this.error(
      ApiErrorCode.VALIDATION_ERROR,
      message,
      details,
      field,
      'validation'
    );
  }

  static authenticationError(message = 'Authentication failed'): ApiResponse {
    return this.error(
      ApiErrorCode.UNAUTHORIZED,
      message,
      undefined,
      undefined,
      'authentication'
    );
  }

  static authorizationError(message = 'Insufficient permissions'): ApiResponse {
    return this.error(
      ApiErrorCode.FORBIDDEN,
      message,
      undefined,
      undefined,
      'authorization'
    );
  }

  static notFoundError(resource = 'Resource', id?: string): ApiResponse {
    return this.error(
      ApiErrorCode.NOT_FOUND,
      `${resource} not found${id ? ` with id: ${id}` : ''}`,
      { resource, id },
      undefined,
      'not_found'
    );
  }

  static rateLimitError(limit: number, windowMs: number): ApiResponse {
    return this.error(
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded. Maximum ${limit} requests per ${windowMs / 1000} seconds`,
      { limit, windowMs },
      undefined,
      'rate_limit'
    );
  }

  static serverError(message = 'Internal server error', details?: any): ApiResponse {
    return this.error(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      message,
      details,
      undefined,
      'server_error'
    );
  }

  static databaseError(operation: string, details?: any): ApiResponse {
    return this.error(
      ApiErrorCode.DATABASE_ERROR,
      `Database operation failed: ${operation}`,
      details,
      undefined,
      'server_error'
    );
  }
}

// HTTP Status Code mappings
export const getHttpStatusFromApiError = (error: ApiError): number => {
  switch (error.type) {
    case 'validation':
    case 'bad_request':
      return 400;
    case 'authentication':
      return 401;
    case 'authorization':
      return 403;
    case 'not_found':
      return 404;
    case 'rate_limit':
      return 429;
    case 'server_error':
    default:
      return 500;
  }
};

export const getHttpStatusFromApiErrorCode = (code: ApiErrorCode | string): number => {
  switch (code) {
    case ApiErrorCode.VALIDATION_ERROR:
    case ApiErrorCode.MISSING_REQUIRED_FIELD:
    case ApiErrorCode.INVALID_FORMAT:
      return 400;
    
    case ApiErrorCode.INVALID_CREDENTIALS:
    case ApiErrorCode.TOKEN_EXPIRED:
    case ApiErrorCode.TOKEN_INVALID:
    case ApiErrorCode.UNAUTHORIZED:
      return 401;
    
    case ApiErrorCode.FORBIDDEN:
    case ApiErrorCode.INSUFFICIENT_PERMISSIONS:
      return 403;
    
    case ApiErrorCode.NOT_FOUND:
      return 404;
    
    case ApiErrorCode.RESOURCE_CONFLICT:
    case ApiErrorCode.DUPLICATE_ENTRY:
      return 409;
    
    case ApiErrorCode.RESOURCE_LOCKED:
      return 423;
    
    case ApiErrorCode.RATE_LIMIT_EXCEEDED:
      return 429;
    
    case ApiErrorCode.INTERNAL_SERVER_ERROR:
    case ApiErrorCode.DATABASE_ERROR:
    case ApiErrorCode.EXTERNAL_SERVICE_ERROR:
    default:
      return 500;
  }
};