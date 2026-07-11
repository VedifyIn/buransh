/**
 * Universal Graph Builder — fluent API for constructing a schema.org @graph.
 *
 * Usage:
 *   const graph = new GraphBuilder('https://vedify.in')
 *     .add(websiteSchema, SCHEMA_PRIORITY.WEBSITE)
 *     .add(blogPostSchema, SCHEMA_PRIORITY.BLOG_POSTING)
 *     .add(authorSchema, SCHEMA_PRIORITY.AUTHOR)
 *     .build();
 */

import { sortByPriority, type PrioritizedSchema } from '../constants/priority-map';
import { deduplicateGraph } from '../utils/deduplicator';

export type SchemaNode = Record<string, unknown>;

export interface GraphSchema {
  '@context': 'https://schema.org';
  '@graph': SchemaNode[];
}

export interface GraphBuilderOptions {
  /**
   * Merge duplicate entities instead of keeping the first.
   * Default: false
   */
  mergeDuplicates?: boolean;
  /**
   * Wrap the graph in the standard @context + @graph envelope.
   * Default: true
   */
  withContext?: boolean;
}

export class GraphBuilder {
  private readonly baseUrl: string;
  private readonly items: PrioritizedSchema[] = [];
  private readonly options: GraphBuilderOptions;

  constructor(baseUrl: string, options: GraphBuilderOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.options = { withContext: true, mergeDuplicates: false, ...options };
  }

  /**
   * Add a schema node with an explicit priority.
   */
  add(schema: SchemaNode, priority: number): this {
    if (schema && typeof schema === 'object') {
      this.items.push({ schema, priority });
    }
    return this;
  }

  /**
   * Add multiple schemas with the same priority.
   */
  addAll(schemas: SchemaNode[], priority: number): this {
    for (const schema of schemas) {
      this.add(schema, priority);
    }
    return this;
  }

  /**
   * Add a schema only if the value is non-null/undefined.
   */
  addIfPresent(schema: SchemaNode | null | undefined, priority: number): this {
    if (schema != null) {
      this.add(schema, priority);
    }
    return this;
  }

  /**
   * Returns the base URL used by this builder.
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Build and return the final @graph array (without @context wrapper).
   */
  buildGraph(): SchemaNode[] {
    const sorted = sortByPriority(this.items).map((item) => item.schema);
    return deduplicateGraph(sorted, { merge: this.options.mergeDuplicates });
  }

  /**
   * Build and return the full JSON-LD document with @context and @graph.
   */
  build(): GraphSchema {
    return {
      '@context': 'https://schema.org',
      '@graph': this.buildGraph(),
    };
  }

  /**
   * Return how many nodes have been added (before deduplication).
   */
  size(): number {
    return this.items.length;
  }
}
