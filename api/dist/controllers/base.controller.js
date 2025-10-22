"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
const uuid_1 = require("uuid");
/**
 * Base Controller Class with enterprise-level patterns
 */
class BaseController {
    constructor() {
        this.logger = console; // In production, use proper logging (winston, etc.)
        /**
         * Wrapper for async route handlers with error handling
         */
        this.asyncHandler = (fn) => {
            return (req, res, next) => {
                const startTime = Date.now();
                const requestId = (0, uuid_1.v4)();
                // Add request tracking
                req.requestId = requestId;
                req.startTime = startTime;
                Promise.resolve(fn(req, res, next))
                    .catch((error) => {
                    this.handleError(error, req, res, next);
                });
            };
        };
    }
    /**
     * Send success response with consistent format
     */
    sendSuccess(res, data, statusCode = 200, meta) {
        var _a;
        const response = {
            success: true,
            data,
            meta: Object.assign({ requestId: res.req.requestId || (0, uuid_1.v4)(), timestamp: Date.now(), executionTime: res.req.startTime ? Date.now() - res.req.startTime : undefined }, meta)
        };
        this.logger.info(`Success Response [${res.req.requestId}]: ${statusCode}`, {
            method: res.req.method,
            url: res.req.originalUrl,
            statusCode,
            executionTime: (_a = response.meta) === null || _a === void 0 ? void 0 : _a.executionTime
        });
        res.status(statusCode).json(response);
    }
    /**
     * Send error response with consistent format
     */
    sendError(res, error, statusCode = 500, errorCode) {
        const errorMessage = typeof error === 'string' ? error : error.message;
        const requestId = res.req.requestId || (0, uuid_1.v4)();
        const response = {
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
    handleError(error, req, res, next) {
        if (error.name === 'ValidationError') {
            this.sendError(res, error.message, 400, 'VALIDATION_ERROR');
        }
        else if (error.name === 'UnauthorizedError') {
            this.sendError(res, 'Unauthorized access', 401, 'UNAUTHORIZED');
        }
        else if (error.name === 'ForbiddenError') {
            this.sendError(res, 'Access forbidden', 403, 'FORBIDDEN');
        }
        else if (error.name === 'NotFoundError') {
            this.sendError(res, 'Resource not found', 404, 'NOT_FOUND');
        }
        else if (error.name === 'ConflictError') {
            this.sendError(res, error.message, 409, 'CONFLICT');
        }
        else if (error.name === 'RateLimitError') {
            this.sendError(res, 'Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
        }
        else {
            // Unknown error
            this.sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
        }
    }
    /**
     * Get standard error code based on HTTP status
     */
    getErrorCode(statusCode) {
        const errorCodes = {
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
    getPaginationParams(req) {
        var _a;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items
        const sortBy = req.query.sortBy;
        const sortOrder = ((_a = req.query.sortOrder) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'desc' ? 'desc' : 'asc';
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
    validateRequiredFields(data, requiredFields) {
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
    sanitizeInput(data) {
        if (typeof data === 'string') {
            return data.trim();
        }
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeInput(item));
        }
        if (typeof data === 'object' && data !== null) {
            const sanitized = {};
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
    checkRateLimit(req) {
        // Implementation would depend on your rate limiting strategy
        // This is a placeholder for rate limiting logic
        const userIP = req.ip;
        // Add rate limiting logic here
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=base.controller.js.map