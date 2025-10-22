"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseTimeMiddleware = exports.requestLogger = exports.requestIdMiddleware = exports.notFoundHandler = exports.errorHandler = void 0;
const app_errors_1 = require("../errors/app-errors");
/**
 * Global Error Handler Middleware
 */
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    // Handle known application errors
    if (error instanceof app_errors_1.AppError) {
        statusCode = error.statusCode;
        errorCode = error.errorCode;
        message = error.message;
    }
    // Handle specific error types
    if (error.name === 'CastError') {
        statusCode = 400;
        errorCode = 'INVALID_ID';
        message = 'Invalid resource ID';
    }
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorCode = 'INVALID_TOKEN';
        message = 'Invalid authentication token';
    }
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        errorCode = 'TOKEN_EXPIRED';
        message = 'Authentication token expired';
    }
    if (error.name === 'MongoError' && error.code === 11000) {
        statusCode = 409;
        errorCode = 'DUPLICATE_ENTRY';
        message = 'Duplicate entry detected';
    }
    const response = {
        success: false,
        error: {
            code: errorCode,
            message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        meta: {
            requestId: req.requestId || 'unknown',
            timestamp: Date.now(),
            executionTime: req.startTime ? Date.now() - req.startTime : undefined
        }
    };
    // Log error
    console.error(`Error [${req.requestId}]: ${statusCode} - ${message}`, {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        error: error.stack,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res) => {
    const response = {
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.originalUrl} not found`
        },
        meta: {
            requestId: req.requestId || 'unknown',
            timestamp: Date.now()
        }
    };
    res.status(404).json(response);
};
exports.notFoundHandler = notFoundHandler;
/**
 * Request ID Middleware
 */
const requestIdMiddleware = (req, res, next) => {
    req.requestId = req.get('X-Request-ID') || require('uuid').v4();
    req.startTime = Date.now();
    // Set response header
    res.set('X-Request-ID', req.requestId);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
/**
 * Request Logging Middleware
 */
const requestLogger = (req, res, next) => {
    console.log(`Incoming Request [${req.requestId}]: ${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    next();
};
exports.requestLogger = requestLogger;
/**
 * Response Time Middleware
 */
const responseTimeMiddleware = (req, res, next) => {
    const startTime = Date.now();
    // Store original end method
    const originalEnd = res.end.bind(res);
    // Override res.end to calculate response time
    res.end = function (chunk, encoding, cb) {
        const responseTime = Date.now() - startTime;
        res.set('X-Response-Time', `${responseTime}ms`);
        console.log(`Response [${req.requestId}]: ${res.statusCode} - ${responseTime}ms`, {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime
        });
        return originalEnd(chunk, encoding, cb);
    };
    next();
};
exports.responseTimeMiddleware = responseTimeMiddleware;
//# sourceMappingURL=error.middleware.js.map