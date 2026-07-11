/**
 * CreativeWork schema validator (Articles, Gists, Quotes, Projects)
 */

import { runChecks, checkRequiredFields, checkDate, checkUrl } from './base-validator';
import type { ValidationResult, SchemaNode } from './base-validator';

export function validateCreativeWorkSchema(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['name']),
    () => checkUrl(schema, 'url'),
    () => checkDate(schema, 'datePublished'),
    () => checkDate(schema, 'dateModified'),
  ]);
}

export function validateSoftwareSourceCodeSchema(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['name', 'author']),
    () => checkUrl(schema, 'url'),
    () => checkUrl(schema, 'codeRepository'),
  ]);
}
