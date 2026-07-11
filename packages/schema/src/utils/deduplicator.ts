/**
 * Deduplicator — removes duplicate entities from a @graph array.
 * Entities are considered duplicates when they share the same `@id`.
 * When duplicates are found, the first occurrence wins (or can be merged).
 */

import { deepMerge } from './merger';

export type SchemaNode = Record<string, unknown>;

export interface DeduplicatorOptions {
  /**
   * When true, duplicate nodes are deep-merged rather than the first winning.
   * Default: false (first occurrence wins).
   */
  merge?: boolean;
}

/**
 * Remove duplicate entities from a @graph array by @id.
 *
 * Nodes without an @id are always kept (they are anonymous inline objects).
 */
export function deduplicateGraph(
  graph: SchemaNode[],
  options: DeduplicatorOptions = {},
): SchemaNode[] {
  const { merge = false } = options;

  const seen = new Map<string, SchemaNode>();
  const order: string[] = [];
  const anonymous: SchemaNode[] = [];

  for (const node of graph) {
    const id = typeof node['@id'] === 'string' ? node['@id'] : null;

    if (!id) {
      // No @id — keep as anonymous
      anonymous.push({ ...node });
      continue;
    }

    if (seen.has(id)) {
      if (merge) {
        // Deep merge the new node into the existing one
        const existing = seen.get(id)!;
        seen.set(id, deepMerge(existing, node, { preserveIds: true }));
      }
      // else: first wins, do nothing
    } else {
      seen.set(id, { ...node });
      order.push(id);
    }
  }

  // Preserve original ordering of unique ids
  const deduped = order.map((id) => seen.get(id)!);

  return [...deduped, ...anonymous];
}

/**
 * Count how many duplicates would be removed
 */
export function countDuplicates(graph: SchemaNode[]): number {
  const seen = new Set<string>();
  let duplicates = 0;

  for (const node of graph) {
    const id = typeof node['@id'] === 'string' ? node['@id'] : null;
    if (!id) continue;

    if (seen.has(id)) {
      duplicates++;
    } else {
      seen.add(id);
    }
  }

  return duplicates;
}

/**
 * Check whether a graph contains duplicate @id values
 */
export function hasDuplicates(graph: SchemaNode[]): boolean {
  return countDuplicates(graph) > 0;
}
