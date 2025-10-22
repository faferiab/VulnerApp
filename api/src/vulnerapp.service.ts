import axios, { AxiosInstance } from 'axios';
import { ExternalServiceError, ConfigurationError } from './errors/app-errors';
import { FunctionType } from './types/applicatonContext';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

/**
 * Service interfaces
 */
export interface UtamServiceFilters {
  functionType?: FunctionType;
  region?: string;
  municipality?: string;
  limit?: number;
  offset?: number;
}

export interface OdServiceFilters {
  origin?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Enterprise-level VulnerApp Service
 * 
 * Handles business logic and external API integration for UTAM and OD data.
 * Includes comprehensive error handling, caching, and monitoring.
 */
export class VulnerAppService {
  private readonly httpClient: AxiosInstance;
  private readonly baseApiUrl: string;
  private readonly apiKey: string;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor() {
    this.baseApiUrl = process.env.BASE_API_URL;
    this.apiKey = process.env.API_KEY;

    if (!this.baseApiUrl || !this.apiKey) {
      throw new ConfigurationError('Missing required environment variables: BASE_API_URL and/or API_KEY');
    }

    // Configure HTTP client with timeout and retry logic
    this.httpClient = axios.create({
      timeout: 30000, // 30 seconds
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
  async getUtamData(filters: UtamServiceFilters): Promise<any> {
    try {
      console.log('VulnerAppService: Getting UTAM data', { filters });

      // Get authentication token
      const token = await this.getAuthToken();

      // Build GraphQL query
      const query = this.buildUtamQuery(filters);

      // Execute GraphQL request
      const response = await this.executeGraphQLQuery(query, token);

      if (response.errors) {
        throw new ExternalServiceError('GraphQL query returned errors');
      }

      return response.data;
    } catch (error) {
      console.error('VulnerAppService: Error getting UTAM data', error);
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError('Failed to fetch UTAM data from external service');
    }
  }

  /**
   * Get OD data with business logic validation
   */
  async getOdData(filters: OdServiceFilters): Promise<any> {
    try {
      console.log('VulnerAppService: Getting OD data', { filters });

      // Get authentication token
      const token = await this.getAuthToken();

      // Build GraphQL query
      const query = this.buildOdQuery(filters);

      // Execute GraphQL request
      const response = await this.executeGraphQLQuery(query, token);

      if (response.errors) {
        throw new ExternalServiceError('GraphQL query returned errors');
      }

      return response.data;
    } catch (error) {
      console.error('VulnerAppService: Error getting OD data', error);
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError('Failed to fetch OD data from external service');
    }
  }

  /**
   * Get and cache authentication token
   */
  private async getAuthToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

    try {
      const authUrl = `${this.baseApiUrl}/auth/providers/api-key/login`;
      const response = await this.httpClient.post(authUrl, {
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
    } catch (error) {
      console.error('VulnerAppService: Authentication failed', error);
      throw new ExternalServiceError('Authentication with external service failed');
    }
  }

  /**
   * Execute GraphQL query
   */
  private async executeGraphQLQuery(query: string, token: string): Promise<any> {
    try {
      const graphqlUrl = `${this.baseApiUrl}/graphql`;
      const response = await this.httpClient.post(
        graphqlUrl,
        { query },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('VulnerAppService: GraphQL query failed', error);
      throw new ExternalServiceError('GraphQL query execution failed');
    }
  }

  /**
   * Build UTAM GraphQL query
   */
  private buildUtamQuery(filters: UtamServiceFilters): string {
    // Build query based on filters
    let whereClause = '';
    const conditions: string[] = [];

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
  private buildOdQuery(filters: OdServiceFilters): string {
    // Build query based on filters
    let whereClause = '';
    const conditions: string[] = [];

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
  private setupAxiosInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('HTTP Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(`HTTP Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('HTTP Response Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Health check for external services
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Try to authenticate
      await this.getAuthToken();
      
      return {
        status: 'healthy',
        details: {
          baseUrl: this.baseApiUrl,
          lastChecked: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date().toISOString()
        }
      };
    }
  }
}