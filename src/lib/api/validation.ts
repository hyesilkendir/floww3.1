/**
 * Input Validation and Sanitization System
 * Production-ready validation with Zod schemas and security measures
 */

import { z } from 'zod';
import { ApiResponseBuilder, ApiErrorCode } from './response';

// Common validation schemas
export const commonSchemas = {
  id: z.string().uuid('Invalid ID format'),
  email: z.string().email('Invalid email format').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s'-]+$/, 'Name contains invalid characters'),
  phone: z.string()
    .regex(/^(\+90|0)?[5][0-9]{9}$/, 'Invalid Turkish phone number format')
    .optional(),
  amount: z.number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount too large'),
  currency: z.enum(['TRY', 'USD', 'EUR']).refine((val) => ['TRY', 'USD', 'EUR'].includes(val), {
    message: 'Invalid currency code'
  }),
  taxRate: z.number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%'),
  date: z.string().datetime('Invalid date format'),
  description: z.string()
    .max(1000, 'Description too long')
    .optional(),
  status: z.enum(['active', 'inactive', 'pending', 'completed', 'cancelled']).refine((val) =>
    ['active', 'inactive', 'pending', 'completed', 'cancelled'].includes(val), {
    message: 'Invalid status'
  }),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
  })
};

// Authentication schemas
export const authSchemas = {
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required')
  }),
  
  register: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    username: commonSchemas.username,
    name: commonSchemas.name,
    phone: commonSchemas.phone
  }),
  
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonSchemas.password
  }),
  
  resetPassword: z.object({
    email: commonSchemas.email
  })
};

// Business entity schemas
export const entitySchemas = {
  client: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone,
    address: z.string().max(500, 'Address too long').optional(),
    taxNumber: z.string().regex(/^\d{10,11}$/, 'Invalid tax number').optional(),
    notes: commonSchemas.description
  }),
  
  invoice: z.object({
    clientId: commonSchemas.id,
    amount: commonSchemas.amount,
    taxAmount: commonSchemas.amount.optional(),
    currency: commonSchemas.currency,
    dueDate: commonSchemas.date,
    description: commonSchemas.description,
    items: z.array(z.object({
      description: z.string().min(1, 'Item description required').max(200),
      quantity: z.number().positive('Quantity must be positive'),
      unitPrice: commonSchemas.amount,
      taxRate: commonSchemas.taxRate.optional()
    })).min(1, 'At least one item required')
  }),
  
  expense: z.object({
    amount: commonSchemas.amount,
    currency: commonSchemas.currency,
    category: z.string().min(1, 'Category is required').max(100),
    description: commonSchemas.description,
    date: commonSchemas.date,
    receiptUrl: z.string().url('Invalid receipt URL').optional()
  }),
  
  employee: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    phone: commonSchemas.phone,
    position: z.string().min(1, 'Position is required').max(100),
    salary: commonSchemas.amount.optional(),
    startDate: commonSchemas.date,
    status: commonSchemas.status
  })
};

// Input sanitization functions
export class InputSanitizer {
  /**
   * Remove potentially harmful HTML tags and scripts
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  /**
   * Sanitize SQL injection attempts
   */
  static sanitizeSql(input: string): string {
    return input
      .replace(/['"`;\\]/g, '')
      .replace(/\b(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC|EXECUTE)\b/gi, '')
      .trim();
  }

  /**
   * Clean and normalize text input
   */
  static sanitizeText(input: string): string {
    return this.sanitizeHtml(input)
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Sanitize email format
   */
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Sanitize phone number
   */
  static sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Comprehensive input sanitization
   */
  static sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (key.toLowerCase().includes('email')) {
          sanitized[key] = this.sanitizeEmail(value);
        } else if (key.toLowerCase().includes('phone')) {
          sanitized[key] = this.sanitizePhone(value);
        } else {
          sanitized[key] = this.sanitizeText(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

// Validation middleware creator
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return async function validateInput(data: unknown): Promise<{ success: true; data: T } | { success: false; response: any }> {
    try {
      // First sanitize the input
      const sanitizedData = typeof data === 'object' && data !== null 
        ? InputSanitizer.sanitizeObject(data as Record<string, any>)
        : data;

      // Then validate with schema
      const validatedData = schema.parse(sanitizedData);
      
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        return {
          success: false,
          response: ApiResponseBuilder.validationError(
            firstError.path.join('.'),
            firstError.message,
            { zodError: error.issues }
          )
        };
      }
      
      return {
        success: false,
        response: ApiResponseBuilder.error(
          ApiErrorCode.VALIDATION_ERROR,
          'Invalid input data',
          { error: error instanceof Error ? error.message : 'Unknown validation error' },
          undefined,
          'validation'
        )
      };
    }
  };
}

// Rate limiting configuration
export const rateLimitConfig = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later'
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later'
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: 'Upload limit exceeded, please try again later'
  }
};

// Request size limits
export const requestLimits = {
  json: '10mb',
  urlencoded: '10mb',
  file: '50mb'
};