/**
 * Production-ready Logging and Monitoring System
 * Comprehensive logging with security audit trails
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum LogCategory {
  AUTH = 'auth',
  API = 'api',
  DATABASE = 'database',
  SECURITY = 'security',
  BUSINESS = 'business',
  SYSTEM = 'system'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'password_change' | 
        'rate_limit_exceeded' | 'suspicious_activity' | 'data_access' | 'permission_denied';
  userId?: string;
  ip: string;
  userAgent: string;
  details: Record<string, any>;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private enableFile: boolean;

  private constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    this.enableConsole = process.env.NODE_ENV === 'development';
    this.enableFile = process.env.ENABLE_FILE_LOGGING === 'true';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, category, message, requestId, userId, ip, method, url, statusCode, duration, error } = entry;
    
    let logLine = `[${timestamp}] ${level.toUpperCase()} [${category}]`;
    
    if (requestId) logLine += ` [${requestId}]`;
    if (userId) logLine += ` [user:${userId}]`;
    if (ip) logLine += ` [ip:${ip}]`;
    if (method && url) logLine += ` ${method} ${url}`;
    if (statusCode) logLine += ` ${statusCode}`;
    if (duration) logLine += ` ${duration}ms`;
    
    logLine += ` ${message}`;
    
    if (error) {
      logLine += `\nError: ${error.name}: ${error.message}`;
      if (error.stack && this.logLevel === LogLevel.DEBUG) {
        logLine += `\nStack: ${error.stack}`;
      }
    }
    
    return logLine;
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedLog = this.formatLogEntry(entry);

    // Console logging
    if (this.enableConsole) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formattedLog);
          break;
        case LogLevel.INFO:
          console.info(formattedLog);
          break;
        case LogLevel.WARN:
          console.warn(formattedLog);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formattedLog);
          break;
      }
    }

    // In production, you would implement file logging or external service logging here
    if (this.enableFile) {
      // Implement file logging or send to external logging service
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // In production, implement integration with logging services like:
    // - Winston file transport
    // - ELK Stack
    // - Datadog
    // - New Relic
    // - CloudWatch
    
    try {
      // Example: Send to external logging API
      if (process.env.LOGGING_ENDPOINT) {
        await fetch(process.env.LOGGING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOGGING_API_KEY}`
          },
          body: JSON.stringify(entry)
        });
      }
    } catch (error) {
      // Fallback to console if external logging fails
      console.error('Failed to send log to external service:', error);
    }
  }

  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Partial<LogEntry>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      ...metadata
    };

    this.writeLog(entry);
  }

  debug(category: LogCategory, message: string, metadata?: Partial<LogEntry>): void {
    this.log(LogLevel.DEBUG, category, message, metadata);
  }

  info(category: LogCategory, message: string, metadata?: Partial<LogEntry>): void {
    this.log(LogLevel.INFO, category, message, metadata);
  }

  warn(category: LogCategory, message: string, metadata?: Partial<LogEntry>): void {
    this.log(LogLevel.WARN, category, message, metadata);
  }

  error(category: LogCategory, message: string, error?: Error, metadata?: Partial<LogEntry>): void {
    const errorMetadata = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : {};

    this.log(LogLevel.ERROR, category, message, { ...metadata, ...errorMetadata });
  }

  fatal(category: LogCategory, message: string, error?: Error, metadata?: Partial<LogEntry>): void {
    const errorMetadata = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : {};

    this.log(LogLevel.FATAL, category, message, { ...metadata, ...errorMetadata });
  }

  // Security-specific logging
  logSecurityEvent(event: SecurityEvent): void {
    this.log(LogLevel.WARN, LogCategory.SECURITY, `Security event: ${event.type}`, {
      ip: event.ip,
      userAgent: event.userAgent,
      userId: event.userId,
      metadata: {
        securityEvent: event,
        severity: event.severity
      }
    });

    // Send critical security events immediately
    if (event.severity === 'critical') {
      this.sendSecurityAlert(event);
    }
  }

  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // In production, implement security alerting:
    // - Send to security team
    // - Trigger automated responses
    // - Block suspicious IPs
    
    try {
      if (process.env.SECURITY_WEBHOOK) {
        await fetch(process.env.SECURITY_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Critical Security Alert: ${event.type}`,
            event
          })
        });
      }
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  // API request logging
  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId: string,
    userId?: string,
    ip?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                 statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    this.log(level, LogCategory.API, `API Request`, {
      method,
      url,
      statusCode,
      duration,
      requestId,
      userId,
      ip,
      userAgent,
      metadata
    });
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    this.log(level, LogCategory.DATABASE, `Database ${operation} on ${table}`, {
      duration,
      userId,
      metadata: {
        ...metadata,
        operation,
        table,
        success
      }
    });
  }

  // Business event logging
  logBusinessEvent(
    event: string,
    userId: string,
    details: Record<string, any>
  ): void {
    this.log(LogLevel.INFO, LogCategory.BUSINESS, `Business event: ${event}`, {
      userId,
      metadata: {
        businessEvent: event,
        ...details
      }
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Helper functions for common logging patterns
export const logRequest = (
  req: Request,
  res: Response,
  duration: number,
  requestId: string,
  userId?: string
) => {
  const ip = req.headers.get('x-forwarded-for') || 
            req.headers.get('x-real-ip') || 
            'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  logger.logApiRequest(
    req.method,
    req.url,
    res.status,
    duration,
    requestId,
    userId,
    ip,
    userAgent
  );
};

export const logSecurityEvent = (
  type: SecurityEvent['type'],
  req: Request,
  details: Record<string, any>,
  severity: SecurityEvent['severity'] = 'medium',
  userId?: string
) => {
  const ip = req.headers.get('x-forwarded-for') || 
            req.headers.get('x-real-ip') || 
            'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  logger.logSecurityEvent({
    type,
    userId,
    ip,
    userAgent,
    details,
    timestamp: new Date().toISOString(),
    severity
  });
};

// Error boundary logging
export const logUnhandledError = (error: Error, context?: string) => {
  logger.fatal(
    LogCategory.SYSTEM,
    `Unhandled error${context ? ` in ${context}` : ''}`,
    error
  );
};