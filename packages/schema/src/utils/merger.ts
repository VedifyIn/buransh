/**
 * Deep merge utilities for schema objects
 */

/**
 * Deep merge two objects, preserving @id references
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
  options: {
    preserveIds?: boolean;
    arrayStrategy?: 'append' | 'replace' | 'unique';
  } = {},
): T {
  const { preserveIds = true, arrayStrategy = 'append' } = options;

  // If source is null or undefined, return target
  if (source == null) {
    return target;
  }

  // Create a copy of target
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      // Special handling for @id - preserve if configured
      if (key === '@id' && preserveIds && targetValue) {
        // Keep the existing @id
        continue;
      }

      // Handle arrays
      if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
        switch (arrayStrategy) {
          case 'append':
            result[key] = [...targetValue, ...sourceValue] as any;
            break;
          case 'replace':
            result[key] = [...sourceValue] as any;
            break;
          case 'unique':
            const combined = [...targetValue, ...sourceValue];
            const seen = new Set();
            result[key] = combined.filter((item) => {
              const id = item['@id'] || JSON.stringify(item);
              if (seen.has(id)) return false;
              seen.add(id);
              return true;
            }) as any;
            break;
        }
      }
      // Handle nested objects
      else if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        // Recursive merge for nested objects
        result[key] = deepMerge(targetValue, sourceValue, options);
      }
      // Handle primitives and other values
      else {
        result[key] = sourceValue as any;
      }
    }
  }

  return result;
}

/**
 * Merge multiple schema objects into one
 */
export function mergeSchemas<T extends Record<string, any>>(
  schemas: T[],
  options?: {
    preserveIds?: boolean;
    arrayStrategy?: 'append' | 'replace' | 'unique';
  },
): T {
  if (!schemas || schemas.length === 0) {
    return {} as T;
  }

  if (schemas.length === 1) {
    return { ...schemas[0] };
  }

  let result = { ...schemas[0] };

  for (let i = 1; i < schemas.length; i++) {
    result = deepMerge(result, schemas[i], options);
  }

  return result;
}

/**
 * Merge schemas with priority - higher priority overrides lower
 */
export function mergeWithPriority<T extends Record<string, any>>(
  schemas: Array<{ schema: T; priority: number }>,
  options?: {
    preserveIds?: boolean;
    arrayStrategy?: 'append' | 'replace' | 'unique';
  },
): T {
  if (!schemas || schemas.length === 0) {
    return {} as T;
  }

  // Sort by priority (lowest first)
  const sorted = [...schemas].sort((a, b) => a.priority - b.priority);

  // Start with lowest priority, merge higher priority into it so it wins
  let result = { ...sorted[0].schema };

  for (let i = 1; i < sorted.length; i++) {
    result = deepMerge(result, sorted[i].schema, options);
  }

  return result;
}

/**
 * Merge schemas with conflict resolution
 */
export function mergeWithConflictResolution<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
  conflictResolver: (key: string, targetValue: any, sourceValue: any) => any,
): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      // If key doesn't exist in target, just add it
      if (!(key in target)) {
        result[key] = sourceValue as any;
        continue;
      }

      // If values are equal, no conflict
      if (JSON.stringify(targetValue) === JSON.stringify(sourceValue)) {
        continue;
      }

      // Resolve conflict using provided resolver
      result[key] = conflictResolver(key, targetValue, sourceValue);
    }
  }

  return result;
}

/**
 * Merge schemas while preserving @id references and deduplicating
 */
export function mergeAndDeduplicate<T extends Record<string, any>>(
  schemas: T[],
  idExtractor: (schema: T) => string | undefined = (schema) => schema['@id'],
): T[] {
  if (!schemas || schemas.length === 0) {
    return [];
  }

  const idMap = new Map<string, T>();

  for (const schema of schemas) {
    const id = idExtractor(schema);

    if (id) {
      // If we already have this ID, merge the schemas
      if (idMap.has(id)) {
        const existing = idMap.get(id)!;
        idMap.set(id, deepMerge(existing, schema, { preserveIds: true }));
      } else {
        idMap.set(id, { ...schema });
      }
    } else {
      // No ID - just add as is
      idMap.set(JSON.stringify(schema), { ...schema });
    }
  }

  return Array.from(idMap.values());
}

/**
 * Check if two schemas have conflicts
 */
export function hasConflicts<T extends Record<string, any>>(
  schema1: T,
  schema2: Partial<T>,
  ignoreKeys: string[] = [],
): { hasConflict: boolean; conflictingKeys: string[] } {
  const conflictingKeys: string[] = [];

  for (const key in schema2) {
    if (Object.prototype.hasOwnProperty.call(schema2, key)) {
      // Skip ignored keys
      if (ignoreKeys.includes(key)) {
        continue;
      }

      const value1 = schema1[key];
      const value2 = schema2[key];

      // If key doesn't exist in schema1, no conflict
      if (!(key in schema1)) {
        continue;
      }

      // Check for deep equality
      if (JSON.stringify(value1) !== JSON.stringify(value2)) {
        conflictingKeys.push(key);
      }
    }
  }

  return {
    hasConflict: conflictingKeys.length > 0,
    conflictingKeys,
  };
}
