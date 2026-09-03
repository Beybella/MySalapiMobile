/**
 * Generic form validation hook
 * Supports real-time validation with touched state
 */

import { useState, useCallback } from 'react';

export type ValidationRule = (value: any, allFields?: any) => string;

export interface FormValidationOptions {
  fields: Record<string, any>;
  rules: Record<string, ValidationRule>;
}

export interface FormValidation {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  validate: (field: string, value: any) => void;
  validateAll: () => boolean;
  markTouched: (field: string) => void;
  markAllTouched: () => void;
  reset: () => void;
  isValid: boolean;
  hasErrors: boolean;
}

export function useFormValidation({ fields, rules }: FormValidationOptions): FormValidation {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback((field: string, value: any) => {
    if (rules[field]) {
      const error = rules[field](value, fields);
      setErrors(prev => ({
        ...prev,
        [field]: error,
      }));
      return !error;
    }
    return true;
  }, [fields, rules]);

  const validateAll = useCallback(() => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(rules).forEach(field => {
      const error = rules[field](fields[field], fields);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [fields, rules]);

  const markTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const markAllTouched = useCallback(() => {
    const allTouched: Record<string, boolean> = {};
    Object.keys(fields).forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);
  }, [fields]);

  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const hasErrors = Object.values(errors).some(error => error !== '');
  const isValid = !hasErrors;

  return {
    errors,
    touched,
    validate,
    validateAll,
    markTouched,
    markAllTouched,
    reset,
    isValid,
    hasErrors,
  };
}

// Common validation rules
export const ValidationRules = {
  required: (fieldName: string) => (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return '';
  },

  email: (value: string) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Invalid email format';
    }
    return '';
  },

  minAmount: (min: number) => (value: string) => {
    const num = parseFloat(value);
    if (!value) return 'Amount is required';
    if (isNaN(num)) return 'Must be a number';
    if (num < min) return `Minimum ₱${min.toLocaleString()}`;
    return '';
  },

  maxAmount: (max: number) => (value: string) => {
    const num = parseFloat(value);
    if (!value) return 'Amount is required';
    if (isNaN(num)) return 'Must be a number';
    if (num > max) return `Maximum ₱${max.toLocaleString()}`;
    return '';
  },

  positiveNumber: (value: string) => {
    const num = parseFloat(value);
    if (!value) return 'Amount is required';
    if (isNaN(num)) return 'Must be a number';
    if (num <= 0) return 'Must be greater than zero';
    return '';
  },

  minLength: (min: number, fieldName: string) => (value: string) => {
    if (!value) return `${fieldName} is required`;
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return '';
  },

  maxLength: (max: number, fieldName: string) => (value: string) => {
    if (value && value.length > max) {
      return `${fieldName} must be at most ${max} characters`;
    }
    return '';
  },

  dateAfter: (compareDate: string, label: string) => (value: string) => {
    if (!value) return 'Date is required';
    if (!compareDate) return '';
    
    const date = new Date(value);
    const compare = new Date(compareDate);
    
    if (date <= compare) {
      return `Must be after ${label}`;
    }
    return '';
  },
};
