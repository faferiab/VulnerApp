"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationError = exports.BusinessLogicError = exports.DatabaseError = exports.ExternalServiceError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = void 0;
/**
 * Base Application Error Class
 */
class AppError extends Error {
    constructor(message, statusCode, errorCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errorCode = errorCode;
        // Maintain proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Validation Error (400)
 */
class ValidationError extends AppError {
    constructor(message = 'Validation failed', details) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Unauthorized Error (401)
 */
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * Forbidden Error (403)
 */
class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403, 'FORBIDDEN');
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * Not Found Error (404)
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Conflict Error (409)
 */
class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
/**
 * Rate Limit Error (429)
 */
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
/**
 * External Service Error (502)
 */
class ExternalServiceError extends AppError {
    constructor(message = 'External service error', service) {
        super(message, 502, 'EXTERNAL_SERVICE_ERROR');
        this.name = 'ExternalServiceError';
    }
}
exports.ExternalServiceError = ExternalServiceError;
/**
 * Database Error (500)
 */
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500, 'DATABASE_ERROR');
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Business Logic Error (422)
 */
class BusinessLogicError extends AppError {
    constructor(message = 'Business logic validation failed') {
        super(message, 422, 'BUSINESS_LOGIC_ERROR');
        this.name = 'BusinessLogicError';
    }
}
exports.BusinessLogicError = BusinessLogicError;
/**
 * Configuration Error (500)
 */
class ConfigurationError extends AppError {
    constructor(message = 'Configuration error') {
        super(message, 500, 'CONFIGURATION_ERROR', false);
        this.name = 'ConfigurationError';
    }
}
exports.ConfigurationError = ConfigurationError;
//# sourceMappingURL=app-errors.js.map