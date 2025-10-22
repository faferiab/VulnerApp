/**
 * Base Application Error Class
 */
export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;

    // Maintain proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * External Service Error (502)
 */
export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error', service?: string) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

/**
 * Business Logic Error (422)
 */
export class BusinessLogicError extends AppError {
  constructor(message: string = 'Business logic validation failed') {
    super(message, 422, 'BUSINESS_LOGIC_ERROR');
    this.name = 'BusinessLogicError';
  }
}

/**
 * Configuration Error (500)
 */
export class ConfigurationError extends AppError {
  constructor(message: string = 'Configuration error') {
    super(message, 500, 'CONFIGURATION_ERROR', false);
    this.name = 'ConfigurationError';
  }
}