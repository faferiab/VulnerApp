import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

// Import middleware
import { 
  errorHandler, 
  notFoundHandler, 
  requestIdMiddleware, 
  requestLogger, 
  responseTimeMiddleware 
} from './middleware/error.middleware';

// Import controllers
import { VulnerAppController } from './vulnerapp.controller';
import { VulnerAppService } from './vulnerapp.service';

// Import legacy controller for backward compatibility
import * as queryGraphQl from './controllers/queryGraphql';

// Load environment variables
dotenv.config({ path: '.env' });

/**
 * Express Application Setup
 */
class VulnerAppServer {
  private app: Application;
  private readonly port: number;
  private readonly host: string;
  private vulnerAppController: VulnerAppController;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '4000');
    this.host = os.hostname();
    
    // Initialize services and controllers
    this.initializeServices();
    
    // Setup middleware
    this.setupMiddleware();
    
    // Setup routes
    this.setupRoutes();
    
    // Setup error handling
    this.setupErrorHandling();
  }

  /**
   * Initialize services and controllers
   */
  private initializeServices(): void {
    try {
      const vulnerAppService = new VulnerAppService();
      this.vulnerAppController = new VulnerAppController(vulnerAppService);
      
      console.log('✅ Services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      process.exit(1);
    }
  }

  /**
   * Setup application middleware
   */
  private setupMiddleware(): void {
    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', true);

    // Request tracking and logging
    this.app.use(requestIdMiddleware);
    this.app.use(requestLogger);
    this.app.use(responseTimeMiddleware);

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static file serving
    this.app.use(express.static('build'));

    console.log('✅ Middleware configured successfully');
  }

  /**
   * Setup application routes
   */
  private setupRoutes(): void {
    // Health check endpoint (should be first)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API v1 routes (new enterprise controller)
    this.app.use('/api/v1', this.vulnerAppController.getRouter());

    // Legacy API routes (for backward compatibility)
    this.app.get('/api/info', queryGraphQl.getUtamByFilter);
    this.app.get('/api/od', queryGraphQl.getOdByFilter);

    // Serve Angular application for all other routes
    this.app.get('/*', (req, res) => {
      res.sendFile(path.resolve('build/index.html'));
    });

    console.log('✅ Routes configured successfully');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler (must be before error handler)
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);

    console.log('✅ Error handling configured successfully');
  }

  /**
   * Start the server
   */
  public start(): void {
    try {
      this.app.listen(this.port, () => {
        console.log(`
🚀 VulnerApp Server Started Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server URL: https://${this.host}:${this.port}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 API Documentation: https://${this.host}:${this.port}/api/v1/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Endpoints:
• GET  /health              - Server health check
• GET  /api/v1/health       - Detailed health check with service status
• GET  /api/v1/metrics      - Application metrics
• GET  /api/v1/utam         - UTAM data (new enterprise endpoint)
• GET  /api/v1/od           - OD data (new enterprise endpoint)
• GET  /api/info            - Legacy UTAM endpoint
• GET  /api/od              - Legacy OD endpoint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      // Close server
      process.exit(0);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  /**
   * Get Express application instance
   */
  public getApp(): Application {
    return this.app;
  }
}

// Create and start server
const server = new VulnerAppServer();
server.start();

// Export for testing
export default server;