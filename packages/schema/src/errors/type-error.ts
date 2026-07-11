import { SchemaError } from './schema-error';

/**
 * Thrown when a type mismatch occurs during schema generation
 */
export class SchemaTypeError extends SchemaError {
  readonly expectedType: string;
  readonly receivedType: string;
  readonly field: string;

  constructor(
    field: string,
    expectedType: string,
    receivedType: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `Type mismatch for field "${field}": expected ${expectedType}, got ${receivedType}`,
      'TYPE_ERROR',
      context,
    );
    this.name = 'SchemaTypeError';
    this.field = field;
    this.expectedType = expectedType;
    this.receivedType = receivedType;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      field: this.field,
      expectedType: this.expectedType,
      receivedType: this.receivedType,
    };
  }
}
