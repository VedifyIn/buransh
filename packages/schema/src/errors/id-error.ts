import { SchemaError } from './schema-error';

/**
 * Thrown when ID generation or resolution fails
 */
export class IdError extends SchemaError {
  readonly entityType?: string;
  readonly identifier?: string;

  constructor(
    message: string,
    entityType?: string,
    identifier?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, 'ID_ERROR', context);
    this.name = 'IdError';
    this.entityType = entityType;
    this.identifier = identifier;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      entityType: this.entityType,
      identifier: this.identifier,
    };
  }
}
