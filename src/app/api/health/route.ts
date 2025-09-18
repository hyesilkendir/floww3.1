/**
 * Enhanced Health Check API Endpoint
 * Production-ready health monitoring with detailed system status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ApiResponseBuilder } from '@/lib/api/response';
import { logger, LogCategory } from '@/lib/api/logger';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  version: string;
  uptime: number;
  services: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    auth: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    nodeVersion: string;
    platform: string;
  };
}

async function checkDatabaseHealth(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    
    // Simple query to test database connectivity
    const { error } = await supabase
      .from('clients')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        error: error.message
      };
    }

    return {
      status: 'healthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

async function checkAuthHealth(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    
    // Test auth service connectivity
    const { error } = await supabase.auth.getSession();

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        error: error.message
      };
    }

    return {
      status: 'healthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown auth error'
    };
  }
}

function getSystemInfo() {
  const memUsage = process.memoryUsage();
  
  return {
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    nodeVersion: process.version,
    platform: process.platform
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check all services
    const [databaseHealth, authHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkAuthHealth()
    ]);

    // Get system information
    const systemInfo = getSystemInfo();

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (databaseHealth.status === 'unhealthy' || authHealth.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (databaseHealth.responseTime! > 1000 || authHealth.responseTime! > 1000) {
      overallStatus = 'degraded';
    }

    // Build health check result
    const healthData: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: databaseHealth,
        auth: authHealth
      },
      system: systemInfo
    };

    // Log health check
    const duration = Date.now() - startTime;
    const clientIp = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') || 'unknown';

    logger.info(LogCategory.SYSTEM, `Health check completed - ${overallStatus}`, {
      ip: clientIp,
      duration,
      metadata: {
        status: overallStatus,
        databaseResponseTime: databaseHealth.responseTime,
        authResponseTime: authHealth.responseTime,
        memoryUsage: systemInfo.memory.percentage
      }
    });

    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 200 : 503;

    if (overallStatus === 'healthy') {
      return NextResponse.json(
        ApiResponseBuilder.success(healthData, 'System is healthy'),
        { status: statusCode }
      );
    } else {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'HEALTH_CHECK_FAILED',
          `System is ${overallStatus}`,
          healthData,
          undefined,
          'server_error'
        ),
        { status: statusCode }
      );
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(LogCategory.SYSTEM, 'Health check system error', error as Error, {
      duration,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    const errorResponse = ApiResponseBuilder.serverError(
      'Health check failed',
      {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    );

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle HEAD requests for simple health checks
export async function HEAD() {
  try {
    const databaseHealth = await checkDatabaseHealth();
    
    if (databaseHealth.status === 'healthy') {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}