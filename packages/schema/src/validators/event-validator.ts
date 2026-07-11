/**
 * Event schema validator
 */

import { runChecks, checkRequiredFields, checkDate, checkUrl } from './base-validator';
import type { ValidationResult, SchemaNode } from './base-validator';
import type { ValidationIssue } from '../errors/validation-error';

export function validateEventSchema(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['name', 'startDate']),
    () => checkDate(schema, 'startDate'),
    () => checkDate(schema, 'endDate'),
    () => checkUrl(schema, 'url'),
    () => {
      const issues: ValidationIssue[] = [];
      const start = schema['startDate'];
      const end = schema['endDate'];
      if (start && end) {
        const startD = new Date(start as string);
        const endD = new Date(end as string);
        if (!isNaN(startD.getTime()) && !isNaN(endD.getTime()) && endD < startD) {
          issues.push({
            field: 'endDate',
            message: 'endDate must be after startDate',
            value: end,
          });
        }
      }
      const organizer = schema['organizer'] as SchemaNode | undefined;
      if (organizer && !organizer['name']) {
        issues.push({
          field: 'organizer.name',
          message: 'organizer.name is recommended',
          value: organizer,
        });
      }
      return issues;
    },
  ]);
}
