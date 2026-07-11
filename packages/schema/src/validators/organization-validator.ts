/**
 * Organization schema validator
 */

import { runChecks, checkRequiredFields, checkUrl } from './base-validator';
import type { ValidationResult, SchemaNode } from './base-validator';

export function validateOrganizationSchema(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['name']),
    () => checkUrl(schema, 'url'),
    () => {
      const logo = schema['logo'] as SchemaNode | undefined;
      if (!logo) return [];
      return logo['url']
        ? []
        : [
            {
              field: 'logo.url',
              message: 'logo.url is required when logo is provided',
              value: logo,
            },
          ];
    },
  ]);
}
