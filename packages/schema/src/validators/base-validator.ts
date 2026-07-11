/**
 * Base validation utilities shared by all validators
 */

import { ValidationError } from '../errors/validation-error';
import type { ValidationIssue } from '../errors/validation-error';

export type SchemaNode = Record<string, unknown>;

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Create a passing result
 */
export function pass(): ValidationResult {
  return { valid: true, issues: [] };
}

/**
 * Create a failing result with issues
 */
export function fail(issues: ValidationIssue[]): ValidationResult {
  return { valid: false, issues };
}

/**
 * Check that required fields are present and non-empty
 */
export function checkRequiredFields(schema: SchemaNode, fields: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const field of fields) {
    const value = schema[field];
    if (value === undefined || value === null || value === '') {
      issues.push({
        field,
        message: `Required field "${field}" is missing or empty`,
        value,
      });
    }
  }
  return issues;
}

/**
 * Check that a field, when present, is a valid absolute URL
 */
export function checkUrl(schema: SchemaNode, field: string): ValidationIssue[] {
  const value = schema[field];
  if (!value) return [];
  if (typeof value !== 'string') {
    return [{ field, message: `"${field}" must be a string URL`, value }];
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return [{ field, message: `"${field}" must use http or https`, value }];
    }
    return [];
  } catch {
    return [{ field, message: `"${field}" is not a valid URL`, value }];
  }
}

/**
 * Check that a field is a valid ISO 8601 date string
 */
export function checkDate(schema: SchemaNode, field: string): ValidationIssue[] {
  const value = schema[field];
  if (!value) return [];
  if (typeof value !== 'string') {
    return [{ field, message: `"${field}" must be an ISO 8601 date string`, value }];
  }
  const parsed = new Date(value as string);
  if (isNaN(parsed.getTime())) {
    return [{ field, message: `"${field}" is not a valid date`, value }];
  }
  return [];
}

/**
 * Run a list of checks and aggregate issues
 */
export function runChecks(checks: Array<() => ValidationIssue[]>): ValidationResult {
  const issues = checks.flatMap((check) => check());
  return issues.length === 0 ? pass() : fail(issues);
}

/**
 * Assert a result is valid, or throw a ValidationError
 */
export function assertValid(result: ValidationResult, context?: Record<string, unknown>): void {
  if (!result.valid) {
    throw new ValidationError(
      `Schema validation failed with ${result.issues.length} issue(s)`,
      result.issues,
      context,
    );
  }
}
