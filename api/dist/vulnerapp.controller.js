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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VulnerAppController = void 0;
const express_1 = require("express");
const base_controller_1 = require("./controllers/base.controller");
const input_validator_1 = require("./validators/input.validator");
const app_errors_1 = require("./errors/app-errors");
/**
 * Enterprise-level VulnerApp Controller
 *
 * Handles all operations related to UTAM (Urban Transport Access Management)
 * and OD (Origin-Destination) data with comprehensive error handling,
 * validation, logging, and standardized responses.
 */
class VulnerAppController extends base_controller_1.BaseController {
    constructor(vulnerAppService) {
        super();
        /**
         * Get UTAM data by filter parameters
         *
         * @route GET /api/utam
         * @param req Express Request object
         * @param res Express Response object
         * @param next Express NextFunction
         */
        this.getUtamByFilter = this.asyncHandler((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate and sanitize input
                const validatedData = this.validateUtamFilterInput(req.query);
                // Log request
                this.logger.info(`Getting UTAM data with filters`, {
                    requestId: req.requestId,
                    filters: validatedData
                });
                // Check for business logic constraints
                this.validateUtamBusinessRules(validatedData);
                // Get data from service layer
                const utamData = yield this.getUtamDataFromService(validatedData);
                // Validate and transform response
                const transformedData = this.transformUtamResponse(utamData);
                // Send successful response
                this.sendSuccess(res, transformedData, 200, {
                    totalCount: transformedData.length,
                    filters: validatedData
                });
            }
            catch (error) {
                next(error);
            }
        }));
        /**
         * Get OD (Origin-Destination) data by filter parameters
         *
         * @route GET /api/od
         * @param req Express Request object
         * @param res Express Response object
         * @param next Express NextFunction
         */
        this.getOdByFilter = this.asyncHandler((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate and sanitize input
                const validatedData = this.validateOdFilterInput(req.query);
                // Log request
                this.logger.info(`Getting OD data with filters`, {
                    requestId: req.requestId,
                    filters: validatedData
                });
                // Check for business logic constraints
                this.validateOdBusinessRules(validatedData);
                // Get data from service layer
                const odData = yield this.getOdDataFromService(validatedData);
                // Validate and transform response
                const transformedData = this.transformOdResponse(odData);
                // Send successful response
                this.sendSuccess(res, transformedData, 200, {
                    totalCount: transformedData.length,
                    filters: validatedData
                });
            }
            catch (error) {
                next(error);
            }
        }));
        /**
         * Health check endpoint for monitoring
         *
         * @route GET /api/health
         */
        this.healthCheck = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const healthData = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                services: {
                    database: yield this.checkDatabaseHealth(),
                    externalApi: yield this.checkExternalApiHealth()
                }
            };
            this.sendSuccess(res, healthData);
        }));
        /**
         * Get application metrics
         *
         * @route GET /api/metrics
         */
        this.getMetrics = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const metrics = {
                requests: {
                    total: 0,
                    success: 0,
                    errors: 0
                },
                performance: {
                    averageResponseTime: 0,
                    memoryUsage: process.memoryUsage(),
                    cpuUsage: process.cpuUsage()
                },
                timestamp: new Date().toISOString()
            };
            this.sendSuccess(res, metrics);
        }));
        this.vulnerAppService = vulnerAppService;
    }
    /**
     * Validate UTAM filter input
     */
    validateUtamFilterInput(query) {
        const rules = [
            Object.assign(Object.assign({ field: 'functionType' }, input_validator_1.CommonValidationRules.OPTIONAL_STRING), { enum: ['estudio', 'redcul', 'salud', 'trabajo'] }),
            Object.assign(Object.assign({ field: 'region' }, input_validator_1.CommonValidationRules.OPTIONAL_STRING), { maxLength: 100 }),
            Object.assign(Object.assign({ field: 'municipality' }, input_validator_1.CommonValidationRules.OPTIONAL_STRING), { maxLength: 100 }),
            Object.assign(Object.assign({ field: 'limit' }, input_validator_1.CommonValidationRules.OPTIONAL_NUMBER), { min: 1, max: 1000 }),
            Object.assign(Object.assign({ field: 'offset' }, input_validator_1.CommonValidationRules.OPTIONAL_NUMBER), { min: 0 })
        ];
        return input_validator_1.InputValidator.validateAndThrow(query, rules);
    }
    /**
     * Validate OD filter input
     */
    validateOdFilterInput(query) {
        const rules = [
            Object.assign(Object.assign({ field: 'origin' }, input_validator_1.CommonValidationRules.OPTIONAL_STRING), { maxLength: 100 }),
            Object.assign(Object.assign({ field: 'destination' }, input_validator_1.CommonValidationRules.OPTIONAL_STRING), { maxLength: 100 }),
            Object.assign(Object.assign({ field: 'dateFrom' }, input_validator_1.CommonValidationRules.OPTIONAL_STRING), { pattern: /^\d{4}-\d{2}-\d{2}$/ }),
            Object.assign(Object.assign({ field: 'dateTo' }, input_validator_1.CommonValidationRules.OPTIONAL_STRING), { pattern: /^\d{4}-\d{2}-\d{2}$/ }),
            Object.assign(Object.assign({ field: 'limit' }, input_validator_1.CommonValidationRules.OPTIONAL_NUMBER), { min: 1, max: 1000 }),
            Object.assign(Object.assign({ field: 'offset' }, input_validator_1.CommonValidationRules.OPTIONAL_NUMBER), { min: 0 })
        ];
        return input_validator_1.InputValidator.validateAndThrow(query, rules);
    }
    /**
     * Validate UTAM business rules
     */
    validateUtamBusinessRules(data) {
        // Example business rule: municipality requires region
        if (data.municipality && !data.region) {
            throw new app_errors_1.BusinessLogicError('Municipality filter requires region to be specified');
        }
        // Example: limit validation
        if (data.limit && data.limit > 500) {
            throw new app_errors_1.BusinessLogicError('Maximum limit of 500 records allowed');
        }
    }
    /**
     * Validate OD business rules
     */
    validateOdBusinessRules(data) {
        // Example business rule: date range validation
        if (data.dateFrom && data.dateTo) {
            const fromDate = new Date(data.dateFrom);
            const toDate = new Date(data.dateTo);
            if (fromDate > toDate) {
                throw new app_errors_1.BusinessLogicError('dateFrom cannot be later than dateTo');
            }
            // Maximum date range of 1 year
            const oneYear = 365 * 24 * 60 * 60 * 1000;
            if (toDate.getTime() - fromDate.getTime() > oneYear) {
                throw new app_errors_1.BusinessLogicError('Date range cannot exceed 1 year');
            }
        }
    }
    /**
     * Get UTAM data from service layer
     * This would integrate with your service and repository layers
     */
    getUtamDataFromService(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // This would call your service layer
                // For now, returning mock data structure based on existing GraphQL response
                if (!this.vulnerAppService) {
                    throw new app_errors_1.ExternalServiceError('Service layer not available');
                }
                // Example service call (implement based on your service layer)
                // return await this.vulnerAppService.getUtamData(filters);
                // Mock response for demonstration
                return {
                    utam_categories: [
                        {
                            utam_id: {
                                _id: "example_id_1",
                                discapacidad: 10,
                                sisben: 20,
                                adulto_mayor: 5,
                                edu_basica: 100,
                                edu_tec: 50,
                                edu_univ: 30
                            },
                            value: 1000
                        }
                    ]
                };
            }
            catch (error) {
                this.logger.error('Error fetching UTAM data from service', { error, filters });
                throw new app_errors_1.ExternalServiceError('Failed to fetch UTAM data');
            }
        });
    }
    /**
     * Get OD data from service layer
     */
    getOdDataFromService(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.vulnerAppService) {
                    throw new app_errors_1.ExternalServiceError('Service layer not available');
                }
                // Example service call
                // return await this.vulnerAppService.getOdData(filters);
                // Mock response for demonstration
                return {
                    utam_ods: [
                        {
                            destino: { _id: "destination_1" },
                            value: 500
                        }
                    ]
                };
            }
            catch (error) {
                this.logger.error('Error fetching OD data from service', { error, filters });
                throw new app_errors_1.ExternalServiceError('Failed to fetch OD data');
            }
        });
    }
    /**
     * Transform UTAM response to standardized format
     */
    transformUtamResponse(data) {
        if (!data || !data.utam_categories) {
            return [];
        }
        return data.utam_categories.map((item) => ({
            utam_id: item.utam_id._id,
            discapacidad: item.utam_id.discapacidad,
            sisben: item.utam_id.sisben,
            adulto_mayor: item.utam_id.adulto_mayor,
            edu_basica: item.utam_id.edu_basica,
            edu_tec: item.utam_id.edu_tec,
            edu_univ: item.utam_id.edu_univ,
            value: item.value
        }));
    }
    /**
     * Transform OD response to standardized format
     */
    transformOdResponse(data) {
        if (!data || !data.utam_ods) {
            return [];
        }
        return data.utam_ods
            .filter((item) => item.destino)
            .map((item) => ({
            utam: item.destino._id,
            value: item.value
        }));
    }
    /**
     * Check database health (implement based on your database)
     */
    checkDatabaseHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Implement database health check
                return 'healthy';
            }
            catch (error) {
                return 'unhealthy';
            }
        });
    }
    /**
     * Check external API health
     */
    checkExternalApiHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Implement external API health check
                return 'healthy';
            }
            catch (error) {
                return 'unhealthy';
            }
        });
    }
    /**
     * Get router with all routes configured
     */
    getRouter() {
        const router = (0, express_1.Router)();
        // UTAM routes
        router.get('/utam', this.getUtamByFilter);
        // OD routes
        router.get('/od', this.getOdByFilter);
        // System routes
        router.get('/health', this.healthCheck);
        router.get('/metrics', this.getMetrics);
        return router;
    }
}
exports.VulnerAppController = VulnerAppController;
//# sourceMappingURL=vulnerapp.controller.js.map