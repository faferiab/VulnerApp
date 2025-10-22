import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-errors';
import { ApiResponse } from '../controllers/base.controller';

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'Internal server error';

  // Handle known application errors
  if (error instanceof AppError) {
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

  if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'Duplicate entry detected';
  }

  const response: ApiResponse = {
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

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
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

/**
 * Request ID Middleware
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = req.get('X-Request-ID') || require('uuid').v4();
  req.startTime = Date.now();
  
  // Set response header
  res.set('X-Request-ID', req.requestId);
  
  next();
};

/**
 * Request Logging Middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  console.log(`Incoming Request [${req.requestId}]: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  next();
};

/**
 * Response Time Middleware
 */
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Store original end method
  const originalEnd = res.end.bind(res);

  // Override res.end to calculate response time
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
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