/**
 * Re-exports from the canonical errors location (src/errors/).
 * All error classes live in src/errors/ — this file is the public package export.
 */
export { SchemaError, ValidationError, IdError, SchemaTypeError } from '../src/errors/index';
export type { ValidationIssue } from '../src/errors/index';
