"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import middleware
const error_middleware_1 = require("./middleware/error.middleware");
// Import controllers
const vulnerapp_controller_1 = require("./vulnerapp.controller");
const vulnerapp_service_1 = require("./vulnerapp.service");
// Import legacy controller for backward compatibility
const queryGraphQl = __importStar(require("./controllers/queryGraphql"));
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
        // Setup error handling
        this.setupErrorHandling();
    }
    /**
     * Initialize services and controllers
     */
    initializeServices() {
        try {
            const vulnerAppService = new vulnerapp_service_1.VulnerAppService();
            this.vulnerAppController = new vulnerapp_controller_1.VulnerAppController(vulnerAppService);
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
        // Trust proxy for accurate IP addresses
        this.app.set('trust proxy', true);
        // Request tracking and logging
        this.app.use(error_middleware_1.requestIdMiddleware);
        this.app.use(error_middleware_1.requestLogger);
        this.app.use(error_middleware_1.responseTimeMiddleware);
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: ((_a = process.env.ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',')) || '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
        }));
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Static file serving
        this.app.use(express_1.default.static('build'));
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
        // API v1 routes (new enterprise controller)
        this.app.use('/api/v1', this.vulnerAppController.getRouter());
        // Legacy API routes (for backward compatibility)
        this.app.get('/api/info', queryGraphQl.getUtamByFilter);
        this.app.get('/api/od', queryGraphQl.getOdByFilter);
        // Serve Angular application for all other routes
        this.app.get('/*', (req, res) => {
            res.sendFile(path_1.default.resolve('build/index.html'));
        });
        console.log('✅ Routes configured successfully');
    }
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // 404 handler (must be before error handler)
        this.app.use(error_middleware_1.notFoundHandler);
        // Global error handler (must be last)
        this.app.use(error_middleware_1.errorHandler);
        console.log('✅ Error handling configured successfully');
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