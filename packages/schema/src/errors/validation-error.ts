import { SchemaError } from './schema-error';

export interface ValidationIssue {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Thrown when a schema fails validation checks
 */
export class ValidationError extends SchemaError {
  readonly issues: ValidationIssue[];

  constructor(message: string, issues: ValidationIssue[], context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
    this.issues = issues;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      issues: this.issues,
    };
  }
}
