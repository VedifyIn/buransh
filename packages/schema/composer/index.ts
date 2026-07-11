export { GraphBuilder } from './graph-builder';
export type { GraphSchema } from './graph-builder';
export { SCHEMA_PRIORITY, sortByPriority, extractSortedSchemas, getPriority } from './priority-map';
export type { PrioritizedSchema, SchemaPriorityKey, SchemaPriorityValue } from './priority-map';
export { deduplicateGraph, countDuplicates, hasDuplicates } from './deduplicator';
export { EntityLinker } from './entity-linker';
export type { EntityRef } from './entity-linker';
export { stripEmpty, truncateStrings, optimizeGraph } from './optimizer';
export type { OptimizeResult } from './optimizer';
