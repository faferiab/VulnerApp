"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonValidationRules = exports.InputValidator = void 0;
const app_errors_1 = require("../errors/app-errors");
/**
 * Input Validator Class
 */
class InputValidator {
    /**
     * Validate data against rules
     */
    static validate(data, rules) {
        const errors = [];
        const sanitizedData = {};
        for (const rule of rules) {
            const value = data[rule.field];
            const fieldError = this.validateField(rule.field, value, rule);
            if (fieldError) {
                errors.push(fieldError);
            }
            else {
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
    static validateField(fieldName, value, rule) {
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
    static validateType(value, type) {
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
    static sanitizeValue(value, type) {
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
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * URL validation
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    /**
     * Throw validation error if validation fails
     */
    static validateAndThrow(data, rules) {
        const result = this.validate(data, rules);
        if (!result.isValid) {
            throw new app_errors_1.ValidationError(`Validation failed: ${result.errors.join(', ')}`);
        }
        return result.sanitizedData;
    }
}
exports.InputValidator = InputValidator;
/**
 * Common validation rules
 */
class CommonValidationRules {
    static stringWithLength(min, max) {
        return {
            type: 'string',
            minLength: min,
            maxLength: max
        };
    }
    static numberInRange(min, max) {
        return {
            type: 'number',
            min,
            max
        };
    }
    static enumField(values) {
        return {
            enum: values
        };
    }
}
exports.CommonValidationRules = CommonValidationRules;
CommonValidationRules.REQUIRED_STRING = {
    required: true,
    type: 'string',
    minLength: 1
};
CommonValidationRules.OPTIONAL_STRING = {
    required: false,
    type: 'string'
};
CommonValidationRules.REQUIRED_EMAIL = {
    required: true,
    type: 'email'
};
CommonValidationRules.OPTIONAL_EMAIL = {
    required: false,
    type: 'email'
};
CommonValidationRules.REQUIRED_NUMBER = {
    required: true,
    type: 'number'
};
CommonValidationRules.OPTIONAL_NUMBER = {
    required: false,
    type: 'number'
};
CommonValidationRules.POSITIVE_NUMBER = {
    type: 'number',
    min: 0
};
CommonValidationRules.REQUIRED_ARRAY = {
    required: true,
    type: 'array',
    minLength: 1
};
CommonValidationRules.OPTIONAL_ARRAY = {
    required: false,
    type: 'array'
};
//# sourceMappingURL=input.validator.js.map