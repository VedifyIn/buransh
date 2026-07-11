/**
 * JobPosting schema validator
 */

import { runChecks, checkRequiredFields, checkDate } from './base-validator';
import type { ValidationResult, SchemaNode } from './base-validator';
import type { ValidationIssue } from '../errors/validation-error';

export function validateJobSchema(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['title', 'description', 'datePosted', 'hiringOrganization']),
    () => checkDate(schema, 'datePosted'),
    () => checkDate(schema, 'validThrough'),
    () => {
      const issues: ValidationIssue[] = [];
      const org = schema['hiringOrganization'] as SchemaNode | undefined;
      if (org && !org['name']) {
        issues.push({ field: 'hiringOrganization.name', message: 'name is required', value: org });
      }
      const salary = schema['baseSalary'] as SchemaNode | undefined;
      if (salary) {
        const value = salary['value'] as SchemaNode | undefined;
        if (!value) {
          issues.push({
            field: 'baseSalary.value',
            message: 'baseSalary.value is required when baseSalary is provided',
            value: salary,
          });
        }
      }
      return issues;
    },
  ]);
}
