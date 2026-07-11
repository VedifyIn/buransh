/**
 * Schema optimizer — removes null/undefined fields, trims oversized strings,
 * and enforces graph-level size limits.
 */

import { GRAPH_LIMITS, DEFAULT_VALUES } from '../constants/default-values';

export type SchemaNode = Record<string, unknown>;

/**
 * Recursively strip keys whose value is null, undefined, or empty string.
 */
export function stripEmpty(obj: unknown): unknown {
  if (obj === null || obj === undefined || obj === '') return undefined;
  if (Array.isArray(obj)) {
    const filtered = obj.map(stripEmpty).filter((v) => v !== undefined);
    return filtered.length > 0 ? filtered : undefined;
  }
  if (typeof obj === 'object') {
    const result: SchemaNode = {};
    for (const [key, value] of Object.entries(obj as SchemaNode)) {
      const cleaned = stripEmpty(value);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }
  return obj;
}

/**
 * Truncate string fields to recommended Google limits.
 * Only truncates known long-form fields; does not touch URLs or @id values.
 */
const TRUNCATE_RULES: Record<string, number> = {
  headline: DEFAULT_VALUES.maxHeadlineLength,
  name: 150,
  description: DEFAULT_VALUES.maxDescriptionLength,
  text: 500,
  reviewBody: 500,
};

export function truncateStrings(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(truncateStrings);

  const result: SchemaNode = {};
  for (const [key, value] of Object.entries(obj as SchemaNode)) {
    if (typeof value === 'string' && key in TRUNCATE_RULES) {
      const max = TRUNCATE_RULES[key]!;
      result[key] = value.length > max ? value.slice(0, max - 1) + '…' : value;
    } else if (typeof value === 'object') {
      result[key] = truncateStrings(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export interface OptimizeResult {
  graph: SchemaNode[];
  warnings: string[];
}

/**
 * Run full optimization pipeline on a @graph array:
 * 1. Strip empty fields
 * 2. Truncate long strings
 * 3. Warn if graph exceeds size limits
 */
export function optimizeGraph(graph: SchemaNode[]): OptimizeResult {
  const warnings: string[] = [];

  // Strip empties and truncate
  const optimized = graph
    .map((node) => stripEmpty(truncateStrings(node)) as SchemaNode)
    .filter(Boolean);

  // Warn if too many nodes
  if (optimized.length > GRAPH_LIMITS.maxNodes) {
    warnings.push(
      `Graph has ${optimized.length} nodes, exceeds recommended limit of ${GRAPH_LIMITS.maxNodes}`,
    );
  }

  // Warn if JSON too large
  const jsonSize = JSON.stringify(optimized).length;
  if (jsonSize > GRAPH_LIMITS.maxJsonSize) {
    warnings.push(
      `JSON-LD is ${jsonSize} bytes, exceeds recommended limit of ${GRAPH_LIMITS.maxJsonSize} bytes`,
    );
  }

  return { graph: optimized, warnings };
}
