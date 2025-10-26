"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
// Import legacy controller for backward compatibility
const mongodb_1 = require("mongodb");
const simple_controller_1 = require("./controllers/simple.controller");
const mongodb_repository_1 = require("./repositories/mongodb.repository");
const simple_service_1 = require("./services/simple.service");
// Load environment variables
dotenv_1.default.config({ path: '.env' });
/**
 * Express Application Setup
 */
class VulnerAppServer {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = parseInt(process.env.PORT || '4000');
        this.host = os_1.default.hostname();
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
    initializeServices() {
        try {
            const MONGO_USER = process.env.MONGO_USER;
            const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
            const MONGO_URL = process.env.MONGO_URL;
            const URL = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_URL}/?retryWrites=true&w=majority&appName=vulnerapp`;
            const client = new mongodb_1.MongoClient(URL, {
                serverApi: {
                    version: mongodb_1.ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                },
                timeoutMS: 3000
            });
            client.connect();
            const repository = (0, mongodb_repository_1.AppRepository)({ client });
            const service = (0, simple_service_1.AppService)({ repository });
            this.vulnerAppController = (0, simple_controller_1.AppController)({ service });
            console.log('✅ Services initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize services:', error);
            process.exit(1);
        }
    }
    /**
     * Setup application middleware
     */
    setupMiddleware() {
        var _a;
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: ((_a = process.env.ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',')) || '*',
            credentials: true,
            methods: ['GET', 'OPTIONS'],
            allowedHeaders: ['Content-Type']
        }));
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Static file serving - serve from build/browser where Angular files are located
        this.app.use(express_1.default.static('build/browser'));
        console.log('✅ Middleware configured successfully');
    }
    /**
     * Setup application routes
     */
    setupRoutes() {
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
            res.sendFile(path_1.default.resolve('build/browser/index.html'));
        });
        console.log('✅ Routes configured successfully');
    }
    /**
     * Start the server
     */
    start() {
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
        }
        catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
    /**
     * Setup graceful shutdown
     */
    setupGracefulShutdown() {
        const gracefulShutdown = (signal) => {
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
    getApp() {
        return this.app;
    }
}
// Create and start server
const server = new VulnerAppServer();
server.start();
// Export for testing
exports.default = server;
//# sourceMappingURL=server.enterprise.js.map