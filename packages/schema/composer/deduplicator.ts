/**
 * Deduplicator — removes duplicate entities from a @graph array.
 * Re-exports from src/utils/deduplicator for backward compatibility.
 */

export { deduplicateGraph, countDuplicates, hasDuplicates } from '../src/utils/deduplicator';
export type { SchemaNode, DeduplicatorOptions } from '../src/utils/deduplicator';
