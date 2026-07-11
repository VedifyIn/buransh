/**
 * Graph-level validator — checks structural correctness of the whole @graph
 */

import { EntityLinker } from '../utils/entity-linker';
import { GRAPH_LIMITS } from '../constants/default-values';
import type { ValidationResult, SchemaNode } from './base-validator';
import type { ValidationIssue } from '../errors/validation-error';

export interface GraphValidationResult extends ValidationResult {
  nodeCount: number;
  jsonSize: number;
  unresolvedRefs: string[];
}

/**
 * Validate an entire @graph array
 */
export function validateGraph(graph: SchemaNode[]): GraphValidationResult {
  const issues: ValidationIssue[] = [];
  const linker = new EntityLinker();
  const jsonSize = JSON.stringify(graph).length;

  // Check node count
  if (graph.length > GRAPH_LIMITS.maxNodes) {
    issues.push({
      field: '@graph',
      message: `Graph has ${graph.length} nodes, limit is ${GRAPH_LIMITS.maxNodes}`,
      value: graph.length,
    });
  }

  // Check JSON size
  if (jsonSize > GRAPH_LIMITS.maxJsonSize) {
    issues.push({
      field: '@graph',
      message: `JSON-LD is ${jsonSize} bytes, limit is ${GRAPH_LIMITS.maxJsonSize}`,
      value: jsonSize,
    });
  }

  // Check for duplicate @id values
  const seenIds = new Set<string>();
  for (const node of graph) {
    const id = node['@id'];
    if (typeof id === 'string') {
      if (seenIds.has(id)) {
        issues.push({ field: '@id', message: `Duplicate @id found: "${id}"`, value: id });
      }
      seenIds.add(id);
    }
  }

  // Check for unresolved @id references
  const unresolvedRefs = linker.validateGraph(graph);
  for (const ref of unresolvedRefs) {
    issues.push({
      field: '@id reference',
      message: `Unresolved @id reference: "${ref}"`,
      value: ref,
    });
  }

  // Ensure all nodes have @type
  for (let i = 0; i < graph.length; i++) {
    if (!graph[i]!['@type']) {
      issues.push({
        field: `@graph[${i}].@type`,
        message: '@type is required on every graph node',
        value: graph[i],
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    nodeCount: graph.length,
    jsonSize,
    unresolvedRefs,
  };
}
