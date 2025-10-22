import { Request, Response, NextFunction, Router } from 'express';
import { BaseController } from './controllers/base.controller';
import { InputValidator, ValidationRule, CommonValidationRules } from './validators/input.validator';
import { 
  ValidationError, 
  NotFoundError, 
  ExternalServiceError,
  BusinessLogicError 
} from './errors/app-errors';
import { FunctionType } from './types/applicatonContext';

/**
 * VulnerApp DTOs (Data Transfer Objects)
 */
export interface GetUtamFilterDto {
  functionType?: FunctionType;
  region?: string;
  municipality?: string;
  limit?: number;
  offset?: number;
}

export interface GetOdFilterDto {
  origin?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface UtamResponse {
  utam_id: string;
  discapacidad?: number;
  sisben?: number;
  adulto_mayor?: number;
  edu_basica?: number;
  edu_tec?: number;
  edu_univ?: number;
  value: number;
}

export interface OdResponse {
  utam: string;
  value: number;
}

/**
 * Enterprise-level VulnerApp Controller
 * 
 * Handles all operations related to UTAM (Urban Transport Access Management)
 * and OD (Origin-Destination) data with comprehensive error handling,
 * validation, logging, and standardized responses.
 */
export class VulnerAppController extends BaseController {
  private readonly vulnerAppService: any; // Will be injected
  
  constructor(vulnerAppService?: any) {
    super();
    this.vulnerAppService = vulnerAppService;
  }

  /**
   * Get UTAM data by filter parameters
   * 
   * @route GET /api/utam
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   */
  public getUtamByFilter = this.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
      const utamData = await this.getUtamDataFromService(validatedData);

      // Validate and transform response
      const transformedData = this.transformUtamResponse(utamData);

      // Send successful response
      this.sendSuccess(res, transformedData, 200, {
        totalCount: transformedData.length,
        filters: validatedData
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Get OD (Origin-Destination) data by filter parameters
   * 
   * @route GET /api/od
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   */
  public getOdByFilter = this.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
      const odData = await this.getOdDataFromService(validatedData);

      // Validate and transform response
      const transformedData = this.transformOdResponse(odData);

      // Send successful response
      this.sendSuccess(res, transformedData, 200, {
        totalCount: transformedData.length,
        filters: validatedData
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Health check endpoint for monitoring
   * 
   * @route GET /api/health
   */
  public healthCheck = this.asyncHandler(async (req: Request, res: Response) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: await this.checkDatabaseHealth(),
        externalApi: await this.checkExternalApiHealth()
      }
    };

    this.sendSuccess(res, healthData);
  });

  /**
   * Get application metrics
   * 
   * @route GET /api/metrics
   */
  public getMetrics = this.asyncHandler(async (req: Request, res: Response) => {
    const metrics = {
      requests: {
        total: 0, // Would be tracked by metrics service
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
  });

  /**
   * Validate UTAM filter input
   */
  private validateUtamFilterInput(query: any): GetUtamFilterDto {
    const rules: ValidationRule[] = [
      {
        field: 'functionType',
        ...CommonValidationRules.OPTIONAL_STRING,
        enum: ['estudio', 'redcul', 'salud', 'trabajo']
      },
      {
        field: 'region',
        ...CommonValidationRules.OPTIONAL_STRING,
        maxLength: 100
      },
      {
        field: 'municipality',
        ...CommonValidationRules.OPTIONAL_STRING,
        maxLength: 100
      },
      {
        field: 'limit',
        ...CommonValidationRules.OPTIONAL_NUMBER,
        min: 1,
        max: 1000
      },
      {
        field: 'offset',
        ...CommonValidationRules.OPTIONAL_NUMBER,
        min: 0
      }
    ];

    return InputValidator.validateAndThrow(query, rules);
  }

  /**
   * Validate OD filter input
   */
  private validateOdFilterInput(query: any): GetOdFilterDto {
    const rules: ValidationRule[] = [
      {
        field: 'origin',
        ...CommonValidationRules.OPTIONAL_STRING,
        maxLength: 100
      },
      {
        field: 'destination',
        ...CommonValidationRules.OPTIONAL_STRING,
        maxLength: 100
      },
      {
        field: 'dateFrom',
        ...CommonValidationRules.OPTIONAL_STRING,
        pattern: /^\d{4}-\d{2}-\d{2}$/
      },
      {
        field: 'dateTo',
        ...CommonValidationRules.OPTIONAL_STRING,
        pattern: /^\d{4}-\d{2}-\d{2}$/
      },
      {
        field: 'limit',
        ...CommonValidationRules.OPTIONAL_NUMBER,
        min: 1,
        max: 1000
      },
      {
        field: 'offset',
        ...CommonValidationRules.OPTIONAL_NUMBER,
        min: 0
      }
    ];

    return InputValidator.validateAndThrow(query, rules);
  }

  /**
   * Validate UTAM business rules
   */
  private validateUtamBusinessRules(data: GetUtamFilterDto): void {
    // Example business rule: municipality requires region
    if (data.municipality && !data.region) {
      throw new BusinessLogicError('Municipality filter requires region to be specified');
    }

    // Example: limit validation
    if (data.limit && data.limit > 500) {
      throw new BusinessLogicError('Maximum limit of 500 records allowed');
    }
  }

  /**
   * Validate OD business rules
   */
  private validateOdBusinessRules(data: GetOdFilterDto): void {
    // Example business rule: date range validation
    if (data.dateFrom && data.dateTo) {
      const fromDate = new Date(data.dateFrom);
      const toDate = new Date(data.dateTo);
      
      if (fromDate > toDate) {
        throw new BusinessLogicError('dateFrom cannot be later than dateTo');
      }

      // Maximum date range of 1 year
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      if (toDate.getTime() - fromDate.getTime() > oneYear) {
        throw new BusinessLogicError('Date range cannot exceed 1 year');
      }
    }
  }

  /**
   * Get UTAM data from service layer
   * This would integrate with your service and repository layers
   */
  private async getUtamDataFromService(filters: GetUtamFilterDto): Promise<any> {
    try {
      // This would call your service layer
      // For now, returning mock data structure based on existing GraphQL response
      if (!this.vulnerAppService) {
        throw new ExternalServiceError('Service layer not available');
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
    } catch (error) {
      this.logger.error('Error fetching UTAM data from service', { error, filters });
      throw new ExternalServiceError('Failed to fetch UTAM data');
    }
  }

  /**
   * Get OD data from service layer
   */
  private async getOdDataFromService(filters: GetOdFilterDto): Promise<any> {
    try {
      if (!this.vulnerAppService) {
        throw new ExternalServiceError('Service layer not available');
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
    } catch (error) {
      this.logger.error('Error fetching OD data from service', { error, filters });
      throw new ExternalServiceError('Failed to fetch OD data');
    }
  }

  /**
   * Transform UTAM response to standardized format
   */
  private transformUtamResponse(data: any): UtamResponse[] {
    if (!data || !data.utam_categories) {
      return [];
    }

    return data.utam_categories.map((item: any) => ({
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
  private transformOdResponse(data: any): OdResponse[] {
    if (!data || !data.utam_ods) {
      return [];
    }

    return data.utam_ods
      .filter((item: any) => item.destino)
      .map((item: any) => ({
        utam: item.destino._id,
        value: item.value
      }));
  }

  /**
   * Check database health (implement based on your database)
   */
  private async checkDatabaseHealth(): Promise<string> {
    try {
      // Implement database health check
      return 'healthy';
    } catch (error) {
      return 'unhealthy';
    }
  }

  /**
   * Check external API health
   */
  private async checkExternalApiHealth(): Promise<string> {
    try {
      // Implement external API health check
      return 'healthy';
    } catch (error) {
      return 'unhealthy';
    }
  }

  /**
   * Get router with all routes configured
   */
  public getRouter(): Router {
    const router = Router();

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