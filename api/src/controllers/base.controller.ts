import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Standard API Response Interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId: string;
    timestamp: number;
    executionTime?: number;
    totalCount?: number;
    filters?: any;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

/**
 * Pagination Interface
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Base Controller Class with enterprise-level patterns
 */
export abstract class BaseController {
  protected readonly logger = console; // In production, use proper logging (winston, etc.)

  /**
   * Wrapper for async route handlers with error handling
   */
  protected asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = uuidv4();
      
      // Add request tracking
      req.requestId = requestId;
      req.startTime = startTime;
      
      Promise.resolve(fn(req, res, next))
        .catch((error) => {
          this.handleError(error, req, res, next);
        });
    };
  };

  /**
   * Send success response with consistent format
   */
  protected sendSuccess<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    meta?: Partial<ApiResponse['meta']>
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      meta: {
        requestId: res.req.requestId || uuidv4(),
        timestamp: Date.now(),
        executionTime: res.req.startTime ? Date.now() - res.req.startTime : undefined,
        ...meta
      }
    };

    this.logger.info(`Success Response [${res.req.requestId}]: ${statusCode}`, {
      method: res.req.method,
      url: res.req.originalUrl,
      statusCode,
      executionTime: response.meta?.executionTime
    });

    res.status(statusCode).json(response);
  }

  /**
   * Send error response with consistent format
   */
  protected sendError(
    res: Response,
    error: Error | string,
    statusCode: number = 500,
    errorCode?: string
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const requestId = res.req.requestId || uuidv4();

    const response: ApiResponse = {
      success: false,
      error: {
        code: errorCode || this.getErrorCode(statusCode),
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' && typeof error === 'object' 
          ? error.stack 
          : undefined
      },
      meta: {
        requestId,
        timestamp: Date.now(),
        executionTime: res.req.startTime ? Date.now() - res.req.startTime : undefined
      }
    };

    this.logger.error(`Error Response [${requestId}]: ${statusCode} - ${errorMessage}`, {
      method: res.req.method,
      url: res.req.originalUrl,
      statusCode,
      error: typeof error === 'object' ? error.stack : error
    });

    res.status(statusCode).json(response);
  }

  /**
   * Central error handler
   */
  protected handleError(
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (error.name === 'ValidationError') {
      this.sendError(res, error.message, 400, 'VALIDATION_ERROR');
    } else if (error.name === 'UnauthorizedError') {
      this.sendError(res, 'Unauthorized access', 401, 'UNAUTHORIZED');
    } else if (error.name === 'ForbiddenError') {
      this.sendError(res, 'Access forbidden', 403, 'FORBIDDEN');
    } else if (error.name === 'NotFoundError') {
      this.sendError(res, 'Resource not found', 404, 'NOT_FOUND');
    } else if (error.name === 'ConflictError') {
      this.sendError(res, error.message, 409, 'CONFLICT');
    } else if (error.name === 'RateLimitError') {
      this.sendError(res, 'Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    } else {
      // Unknown error
      this.sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  }

  /**
   * Get standard error code based on HTTP status
   */
  private getErrorCode(statusCode: number): string {
    const errorCodes: { [key: number]: string } = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE'
    };

    return errorCodes[statusCode] || 'UNKNOWN_ERROR';
  }

  /**
   * Extract pagination parameters from request
   */
  protected getPaginationParams(req: Request): PaginationParams {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 items
    const sortBy = req.query.sortBy as string;
    const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc';

    return {
      page: Math.max(page, 1),
      limit: Math.max(limit, 1),
      sortBy,
      sortOrder
    };
  }

  /**
   * Validate required fields
   */
  protected validateRequiredFields(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
      error.name = 'ValidationError';
      throw error;
    }
  }

  /**
   * Sanitize input data
   */
  protected sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      return data.trim();
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Rate limiting helper
   */
  protected checkRateLimit(req: Request): void {
    // Implementation would depend on your rate limiting strategy
    // This is a placeholder for rate limiting logic
    const userIP = req.ip;
    // Add rate limiting logic here
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
      user?: any; // Add user type as needed
    }
  }
}