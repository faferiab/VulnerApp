import { ValidationError } from '../errors/app-errors';

/**
 * Data Transfer Object (DTO) validation interface
 */
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  enum?: any[];
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

/**
 * Input Validator Class
 */
export class InputValidator {
  /**
   * Validate data against rules
   */
  static validate(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    for (const rule of rules) {
      const value = data[rule.field];
      const fieldError = this.validateField(rule.field, value, rule);
      
      if (fieldError) {
        errors.push(fieldError);
      } else {
        // Sanitize the value
        sanitizedData[rule.field] = this.sanitizeValue(value, rule.type);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  /**
   * Validate individual field
   */
  private static validateField(fieldName: string, value: any, rule: ValidationRule): string | null {
    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      return `${fieldName} is required`;
    }

    // Skip validation if value is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Type validation
    if (rule.type && !this.validateType(value, rule.type)) {
      return `${fieldName} must be of type ${rule.type}`;
    }

    // String validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${fieldName} must be at least ${rule.minLength} characters long`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${fieldName} must be no more than ${rule.maxLength} characters long`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return `${fieldName} format is invalid`;
      }
    }

    // Number validations
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `${fieldName} must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `${fieldName} must be no more than ${rule.max}`;
      }
    }

    // Array validations
    if (rule.type === 'array' && Array.isArray(value)) {
      if (rule.minLength && value.length < rule.minLength) {
        return `${fieldName} must contain at least ${rule.minLength} items`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${fieldName} must contain no more than ${rule.maxLength} items`;
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      return `${fieldName} must be one of: ${rule.enum.join(', ')}`;
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        return typeof customResult === 'string' ? customResult : `${fieldName} is invalid`;
      }
    }

    return null;
  }

  /**
   * Validate value type
   */
  private static validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'email':
        return typeof value === 'string' && this.isValidEmail(value);
      case 'url':
        return typeof value === 'string' && this.isValidUrl(value);
      default:
        return true;
    }
  }

  /**
   * Sanitize value based on type
   */
  private static sanitizeValue(value: any, type?: string): any {
    if (value === undefined || value === null) {
      return value;
    }

    switch (type) {
      case 'string':
        return typeof value === 'string' ? value.trim() : String(value).trim();
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value);
      case 'boolean':
        return typeof value === 'boolean' ? value : Boolean(value);
      default:
        return value;
    }
  }

  /**
   * Email validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * URL validation
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Throw validation error if validation fails
   */
  static validateAndThrow(data: any, rules: ValidationRule[]): any {
    const result = this.validate(data, rules);
    if (!result.isValid) {
      throw new ValidationError(`Validation failed: ${result.errors.join(', ')}`);
    }
    return result.sanitizedData;
  }
}

/**
 * Common validation rules
 */
export class CommonValidationRules {
  static readonly REQUIRED_STRING: Partial<ValidationRule> = {
    required: true,
    type: 'string',
    minLength: 1
  };

  static readonly OPTIONAL_STRING: Partial<ValidationRule> = {
    required: false,
    type: 'string'
  };

  static readonly REQUIRED_EMAIL: Partial<ValidationRule> = {
    required: true,
    type: 'email'
  };

  static readonly OPTIONAL_EMAIL: Partial<ValidationRule> = {
    required: false,
    type: 'email'
  };

  static readonly REQUIRED_NUMBER: Partial<ValidationRule> = {
    required: true,
    type: 'number'
  };

  static readonly OPTIONAL_NUMBER: Partial<ValidationRule> = {
    required: false,
    type: 'number'
  };

  static readonly POSITIVE_NUMBER: Partial<ValidationRule> = {
    type: 'number',
    min: 0
  };

  static readonly REQUIRED_ARRAY: Partial<ValidationRule> = {
    required: true,
    type: 'array',
    minLength: 1
  };

  static readonly OPTIONAL_ARRAY: Partial<ValidationRule> = {
    required: false,
    type: 'array'
  };

  static stringWithLength(min: number, max: number): Partial<ValidationRule> {
    return {
      type: 'string',
      minLength: min,
      maxLength: max
    };
  }

  static numberInRange(min: number, max: number): Partial<ValidationRule> {
    return {
      type: 'number',
      min,
      max
    };
  }

  static enumField(values: any[]): Partial<ValidationRule> {
    return {
      enum: values
    };
  }
}