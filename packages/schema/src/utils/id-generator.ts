/**
 * ID generation utilities for schema.org entities
 */

import type {
  EntityType,
  IdGenerationConfig,
  GeneratedId,
  IdValidationResult,
} from '../types/identifiers';
import { ID_PATTERNS, ID_VALIDATION_PATTERNS, DEFAULT_ID_CONFIG } from '../types/identifiers';

/**
 * Slugify a string for use in URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique ID for a schema.org entity
 */
export function generateSchemaId(
  entityType: EntityType,
  identifier: string,
  config: IdGenerationConfig = DEFAULT_ID_CONFIG,
): GeneratedId {
  const { baseUrl, idSeparator = '/', fragmentSeparator = '#', useSlugs = true } = config;

  // Clean the base URL
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  // Get the entity path from patterns
  const entityPath = ID_PATTERNS[entityType];

  // Process the identifier
  const processedIdentifier = useSlugs ? slugify(identifier) : encodeURIComponent(identifier);

  // Construct the full ID
  const fullId = `${cleanBaseUrl}${idSeparator}${entityPath}${fragmentSeparator}${processedIdentifier}`;

  return {
    entityType,
    identifier: processedIdentifier,
    fullId,
    fragment: processedIdentifier,
  };
}

/**
 * Generate IDs for a collection of entities
 */
export function generateCollectionIds(
  entityType: EntityType,
  identifiers: string[],
  config: IdGenerationConfig = DEFAULT_ID_CONFIG,
): Map<string, GeneratedId> {
  const idMap = new Map<string, GeneratedId>();
  const seenIds = new Set<string>();

  for (const identifier of identifiers) {
    const generatedId = generateSchemaId(entityType, identifier, config);

    // Check for collisions
    if (seenIds.has(generatedId.fullId)) {
      throw new Error(`ID collision detected for ${entityType}: ${identifier}`);
    }

    seenIds.add(generatedId.fullId);
    idMap.set(identifier, generatedId);
  }

  return idMap;
}

/**
 * Validate a schema ID
 */
export function validateSchemaId(id: string): IdValidationResult {
  // Check if it's a full ID
  if (ID_VALIDATION_PATTERNS.FULL_ID.test(id)) {
    try {
      const url = new URL(id);
      // pathname is like /person, hash is like #vaidic
      const entityPath = url.pathname.replace(/^\//, '');
      const fragment = url.hash.substring(1); // strip leading '#'

      // Find the entity type from the path
      const entityType = Object.entries(ID_PATTERNS).find(
        ([, path]) => path === entityPath,
      )?.[0] as EntityType | undefined;

      if (!entityType) {
        return {
          isValid: false,
          error: `Unknown entity type in path: ${entityPath}`,
        };
      }

      return {
        isValid: true,
        parsed: {
          baseUrl: `${url.protocol}//${url.host}`,
          entityType,
          identifier: fragment || entityPath,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid URL format: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  // Check if it's a relative ID
  if (ID_VALIDATION_PATTERNS.RELATIVE_ID.test(id)) {
    const [entityPath, fragment] = id.substring(1).split('#');

    const entityType = Object.entries(ID_PATTERNS).find(([, path]) => path === entityPath)?.[0] as
      EntityType | undefined;

    if (!entityType) {
      return {
        isValid: false,
        error: `Unknown entity type in path: ${entityPath}`,
      };
    }

    return {
      isValid: true,
      parsed: {
        baseUrl: '',
        entityType,
        identifier: fragment || entityPath,
      },
    };
  }

  // Check if it's just a fragment
  if (ID_VALIDATION_PATTERNS.FRAGMENT_ID.test(id)) {
    return {
      isValid: true,
      parsed: {
        baseUrl: '',
        entityType: 'Person' as EntityType, // Default fallback
        identifier: id.substring(1),
      },
    };
  }

  return {
    isValid: false,
    error: 'ID does not match any valid pattern',
  };
}

/**
 * Resolve a relative ID to a full ID
 */
export function resolveId(id: string, baseUrl: string = DEFAULT_ID_CONFIG.baseUrl): string {
  const validation = validateSchemaId(id);

  if (!validation.isValid) {
    throw new Error(`Invalid ID: ${validation.error}`);
  }

  if (!validation.parsed) {
    throw new Error('Failed to parse ID');
  }

  const { entityType, identifier } = validation.parsed;

  // If it's already a full ID, return it
  if (id.startsWith('http')) {
    return id;
  }

  // Generate a new full ID
  if (!entityType) {
    throw new Error('Cannot resolve ID: entity type is undefined');
  }

  // Validate entity type
  if (!isValidEntityType(entityType)) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  const generated = generateSchemaId(entityType, identifier, {
    ...DEFAULT_ID_CONFIG,
    baseUrl,
  });

  return generated.fullId;
}

/**
 * Check if a string is a valid EntityType
 */
export function isValidEntityType(type: string): type is EntityType {
  return Object.keys(ID_PATTERNS).includes(type);
}

/**
 * Extract entity type from an ID
 */
export function extractEntityType(id: string): EntityType | null {
  const validation = validateSchemaId(id);

  if (!validation.isValid || !validation.parsed) {
    return null;
  }

  const { entityType } = validation.parsed;
  return isValidEntityType(entityType) ? entityType : null;
}

/**
 * Extract identifier from an ID
 */
export function extractIdentifier(id: string): string | null {
  const validation = validateSchemaId(id);

  if (!validation.isValid || !validation.parsed) {
    return null;
  }

  return validation.parsed.identifier;
}
