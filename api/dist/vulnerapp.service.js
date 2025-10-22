"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VulnerAppService = void 0;
const axios_1 = __importDefault(require("axios"));
const app_errors_1 = require("./errors/app-errors");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env' });
/**
 * Enterprise-level VulnerApp Service
 *
 * Handles business logic and external API integration for UTAM and OD data.
 * Includes comprehensive error handling, caching, and monitoring.
 */
class VulnerAppService {
    constructor() {
        this.tokenCache = null;
        this.baseApiUrl = process.env.BASE_API_URL;
        this.apiKey = process.env.API_KEY;
        if (!this.baseApiUrl || !this.apiKey) {
            throw new app_errors_1.ConfigurationError('Missing required environment variables: BASE_API_URL and/or API_KEY');
        }
        // Configure HTTP client with timeout and retry logic
        this.httpClient = axios_1.default.create({
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'VulnerApp-Service/1.0'
            }
        });
        this.setupAxiosInterceptors();
    }
    /**
     * Get UTAM data with business logic validation
     */
    getUtamData(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('VulnerAppService: Getting UTAM data', { filters });
                // Get authentication token
                const token = yield this.getAuthToken();
                // Build GraphQL query
                const query = this.buildUtamQuery(filters);
                // Execute GraphQL request
                const response = yield this.executeGraphQLQuery(query, token);
                if (response.errors) {
                    throw new app_errors_1.ExternalServiceError('GraphQL query returned errors');
                }
                return response.data;
            }
            catch (error) {
                console.error('VulnerAppService: Error getting UTAM data', error);
                if (error instanceof app_errors_1.ExternalServiceError) {
                    throw error;
                }
                throw new app_errors_1.ExternalServiceError('Failed to fetch UTAM data from external service');
            }
        });
    }
    /**
     * Get OD data with business logic validation
     */
    getOdData(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('VulnerAppService: Getting OD data', { filters });
                // Get authentication token
                const token = yield this.getAuthToken();
                // Build GraphQL query
                const query = this.buildOdQuery(filters);
                // Execute GraphQL request
                const response = yield this.executeGraphQLQuery(query, token);
                if (response.errors) {
                    throw new app_errors_1.ExternalServiceError('GraphQL query returned errors');
                }
                return response.data;
            }
            catch (error) {
                console.error('VulnerAppService: Error getting OD data', error);
                if (error instanceof app_errors_1.ExternalServiceError) {
                    throw error;
                }
                throw new app_errors_1.ExternalServiceError('Failed to fetch OD data from external service');
            }
        });
    }
    /**
     * Get and cache authentication token
     */
    getAuthToken() {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if we have a valid cached token
            if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
                return this.tokenCache.token;
            }
            try {
                const authUrl = `${this.baseApiUrl}/auth/providers/api-key/login`;
                const response = yield this.httpClient.post(authUrl, {
                    key: this.apiKey
                });
                const token = response.data.token || response.data.access_token;
                if (!token) {
                    throw new Error('No token received from authentication endpoint');
                }
                // Cache token for 50 minutes (assuming 1 hour expiry)
                this.tokenCache = {
                    token,
                    expiresAt: Date.now() + (50 * 60 * 1000)
                };
                return token;
            }
            catch (error) {
                console.error('VulnerAppService: Authentication failed', error);
                throw new app_errors_1.ExternalServiceError('Authentication with external service failed');
            }
        });
    }
    /**
     * Execute GraphQL query
     */
    executeGraphQLQuery(query, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const graphqlUrl = `${this.baseApiUrl}/graphql`;
                const response = yield this.httpClient.post(graphqlUrl, { query }, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                return response.data;
            }
            catch (error) {
                console.error('VulnerAppService: GraphQL query failed', error);
                throw new app_errors_1.ExternalServiceError('GraphQL query execution failed');
            }
        });
    }
    /**
     * Build UTAM GraphQL query
     */
    buildUtamQuery(filters) {
        // Build query based on filters
        let whereClause = '';
        const conditions = [];
        if (filters.functionType) {
            conditions.push(`function_type: "${filters.functionType}"`);
        }
        if (filters.region) {
            conditions.push(`region: "${filters.region}"`);
        }
        if (filters.municipality) {
            conditions.push(`municipality: "${filters.municipality}"`);
        }
        if (conditions.length > 0) {
            whereClause = `where: {${conditions.join(', ')}}`;
        }
        // Add pagination
        let limitClause = '';
        if (filters.limit) {
            limitClause += `limit: ${filters.limit}`;
        }
        if (filters.offset) {
            limitClause += `, offset: ${filters.offset}`;
        }
        return `
      query {
        utam_categories(${whereClause} ${limitClause}) {
          utam_id {
            _id
            discapacidad
            sisben
            adulto_mayor
            edu_basica
            edu_tec
            edu_univ
          }
          value
        }
      }
    `;
    }
    /**
     * Build OD GraphQL query
     */
    buildOdQuery(filters) {
        // Build query based on filters
        let whereClause = '';
        const conditions = [];
        if (filters.origin) {
            conditions.push(`origin: "${filters.origin}"`);
        }
        if (filters.destination) {
            conditions.push(`destination: "${filters.destination}"`);
        }
        if (filters.dateFrom) {
            conditions.push(`date_from: "${filters.dateFrom}"`);
        }
        if (filters.dateTo) {
            conditions.push(`date_to: "${filters.dateTo}"`);
        }
        if (conditions.length > 0) {
            whereClause = `where: {${conditions.join(', ')}}`;
        }
        // Add pagination
        let limitClause = '';
        if (filters.limit) {
            limitClause += `limit: ${filters.limit}`;
        }
        if (filters.offset) {
            limitClause += `, offset: ${filters.offset}`;
        }
        return `
      query {
        utam_ods(${whereClause} ${limitClause}) {
          destino {
            _id
          }
          value
        }
      }
    `;
    }
    /**
     * Setup Axios interceptors for logging and error handling
     */
    setupAxiosInterceptors() {
        // Request interceptor
        this.httpClient.interceptors.request.use((config) => {
            var _a;
            console.log(`HTTP Request: ${(_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            console.error('HTTP Request Error:', error);
            return Promise.reject(error);
        });
        // Response interceptor
        this.httpClient.interceptors.response.use((response) => {
            console.log(`HTTP Response: ${response.status} ${response.config.url}`);
            return response;
        }, (error) => {
            var _a, _b;
            console.error('HTTP Response Error:', {
                url: (_a = error.config) === null || _a === void 0 ? void 0 : _a.url,
                status: (_b = error.response) === null || _b === void 0 ? void 0 : _b.status,
                message: error.message
            });
            return Promise.reject(error);
        });
    }
    /**
     * Health check for external services
     */
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Try to authenticate
                yield this.getAuthToken();
                return {
                    status: 'healthy',
                    details: {
                        baseUrl: this.baseApiUrl,
                        lastChecked: new Date().toISOString()
                    }
                };
            }
            catch (error) {
                return {
                    status: 'unhealthy',
                    details: {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        lastChecked: new Date().toISOString()
                    }
                };
            }
        });
    }
}
exports.VulnerAppService = VulnerAppService;
//# sourceMappingURL=vulnerapp.service.js.map