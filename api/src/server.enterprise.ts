import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import os from 'os';
import path from 'path';

// Import legacy controller for backward compatibility
import { MongoClient, ServerApiVersion } from 'mongodb';
import { AppController, IRestController } from './controllers/simple.controller';
import { AppRepository } from './repositories/mongodb.repository';
import { AppService } from './services/simple.service';

// Load environment variables
dotenv.config({ path: '.env' });

/**
 * Express Application Setup
 */
class VulnerAppServer {
  private app: Application;
  private readonly port: number;
  private readonly host: string;
  private vulnerAppController: IRestController;

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

  }

  /**
   * Initialize services and controllers
   */
  private initializeServices(): void {
    try {
      const MONGO_USER = process.env.MONGO_USER;
      const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
      const MONGO_URL = process.env.MONGO_URL;
      const URL = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_URL}/?retryWrites=true&w=majority&appName=vulnerapp`
      const client = new MongoClient(URL, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        timeoutMS: 3000
      });
      client.connect();

      const repository = AppRepository({ client });
      const service = AppService({ repository });
      this.vulnerAppController = AppController({ service });

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

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
      methods: ['GET', 'OPTIONS'],
      allowedHeaders: ['Content-Type']
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

    // API routes (new enterprise controller)
    this.app.use('/api', this.vulnerAppController.getRouter());

    // Serve Angular application for all other routes
    this.app.get('/*', (req, res) => {
      res.sendFile(path.resolve('build/index.html'));
    });

    console.log('✅ Routes configured successfully');
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
• GET  /api/v1/utam         - UTAM data (new enterprise endpoint)
• GET  /api/v1/od           - OD data (new enterprise endpoint)
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