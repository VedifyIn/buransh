/**
 * Person schema validator
 */

import { runChecks, checkRequiredFields, checkUrl } from './base-validator';
import type { ValidationResult, SchemaNode } from './base-validator';
import type { ValidationIssue } from '../errors/validation-error';

export function validatePersonSchema(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['name']),
    () => checkUrl(schema, 'url'),
    () => {
      const issues: ValidationIssue[] = [];
      const sameAs = schema['sameAs'];
      if (sameAs && Array.isArray(sameAs)) {
        for (let i = 0; i < sameAs.length; i++) {
          if (typeof sameAs[i] !== 'string') {
            issues.push({
              field: `sameAs[${i}]`,
              message: 'Each sameAs entry must be a string URL',
              value: sameAs[i],
            });
          }
        }
      }
      return issues;
    },
  ]);
}
