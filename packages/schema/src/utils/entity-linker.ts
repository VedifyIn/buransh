/**
 * Entity Linker — registers and resolves @id cross-references in a graph.
 *
 * When multiple schemas reference the same entity (e.g. author appears in
 * BlogPosting AND a standalone Person node), they must share the same @id.
 * This helper keeps a registry so you can look up a canonical @id by entity
 * type and identifier.
 */

export type SchemaNode = Record<string, unknown>;

export interface EntityRef {
  '@id': string;
}

export class EntityLinker {
  private readonly registry = new Map<string, string>();

  /**
   * Register an entity's @id under a logical key.
   * key convention: `${entityType}:${identifier}` e.g. `Person:vaidic`
   */
  register(key: string, id: string): void {
    this.registry.set(key, id);
  }

  /**
   * Look up a registered @id.
   * Returns undefined when not found.
   */
  resolve(key: string): string | undefined {
    return this.registry.get(key);
  }

  /**
   * Create a bare reference object `{ "@id": "..." }` for use inside schemas.
   * Throws if the key is not registered.
   */
  ref(key: string): EntityRef {
    const id = this.registry.get(key);
    if (!id) {
      throw new Error(`EntityLinker: no entity registered for key "${key}"`);
    }
    return { '@id': id };
  }

  /**
   * Create a reference if the key is registered, otherwise return undefined.
   */
  refIfPresent(key: string): EntityRef | undefined {
    const id = this.registry.get(key);
    return id ? { '@id': id } : undefined;
  }

  /**
   * Walk a graph and report any `@id` strings that are referenced inside
   * nodes but not present as top-level @id values.
   *
   * Returns an array of unresolved @id strings (empty = all good).
   */
  validateGraph(graph: SchemaNode[]): string[] {
    const defined = new Set<string>();
    const referenced = new Set<string>();

    function walk(obj: unknown): void {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(walk);
        return;
      }
      const node = obj as SchemaNode;
      if (typeof node['@id'] === 'string') {
        defined.add(node['@id']);
      }
      for (const [key, value] of Object.entries(node)) {
        if (key === '@id') continue;
        if (typeof value === 'string' && value.startsWith('https://schema.org/')) continue;
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          typeof (value as SchemaNode)['@id'] === 'string'
        ) {
          // It's a reference — only an @id key
          const keys = Object.keys(value as object);
          if (keys.length === 1 && keys[0] === '@id') {
            referenced.add((value as EntityRef)['@id']);
          } else {
            walk(value);
          }
        } else {
          walk(value);
        }
      }
    }

    for (const node of graph) {
      walk(node);
    }

    const unresolved: string[] = [];
    for (const ref of referenced) {
      if (!defined.has(ref)) {
        unresolved.push(ref);
      }
    }
    return unresolved;
  }

  /**
   * Clear the registry (useful for testing).
   */
  clear(): void {
    this.registry.clear();
  }
}
