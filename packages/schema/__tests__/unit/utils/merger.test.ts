import { describe, it, expect } from 'vitest';
import {
  deepMerge,
  mergeSchemas,
  mergeWithPriority,
  mergeAndDeduplicate,
  hasConflicts,
} from '../../../src/utils/merger';

describe('deepMerge', () => {
  it('merges two flat objects', () => {
    const result = deepMerge<Record<string, number>>({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('source value overrides target', () => {
    const result = deepMerge({ a: 1 }, { a: 2 });
    expect(result.a).toBe(2);
  });

  it('preserves @id when preserveIds=true (default)', () => {
    const result = deepMerge({ '@id': 'original' }, { '@id': 'overridden' });
    expect(result['@id']).toBe('original');
  });

  it('overwrites @id when preserveIds=false', () => {
    const result = deepMerge(
      { '@id': 'original' },
      { '@id': 'overridden' },
      { preserveIds: false },
    );
    expect(result['@id']).toBe('overridden');
  });

  it('appends arrays by default', () => {
    const result = deepMerge({ tags: ['a', 'b'] }, { tags: ['c'] });
    expect(result.tags).toEqual(['a', 'b', 'c']);
  });

  it('replaces arrays when strategy=replace', () => {
    const result = deepMerge({ tags: ['a', 'b'] }, { tags: ['c'] }, { arrayStrategy: 'replace' });
    expect(result.tags).toEqual(['c']);
  });

  it('deduplicates arrays when strategy=unique', () => {
    const result = deepMerge(
      { items: [{ '@id': '1', name: 'A' }] },
      {
        items: [
          { '@id': '1', name: 'B' },
          { '@id': '2', name: 'C' },
        ],
      },
      { arrayStrategy: 'unique' },
    );
    // @id='1' appears once, @id='2' added
    expect(result.items).toHaveLength(2);
  });

  it('recursively merges nested objects', () => {
    const result = deepMerge<Record<string, Record<string, number>>>(
      { nested: { a: 1, b: 2 } },
      { nested: { b: 99, c: 3 } },
    );
    expect(result.nested).toEqual({ a: 1, b: 99, c: 3 });
  });
});

describe('mergeSchemas', () => {
  it('returns empty object for empty array', () => {
    expect(mergeSchemas([])).toEqual({});
  });

  it('returns copy of single schema', () => {
    const schema = { '@type': 'Person', name: 'Alice' };
    const result = mergeSchemas([schema]);
    expect(result).toEqual(schema);
    expect(result).not.toBe(schema); // copy
  });

  it('merges multiple schemas', () => {
    const result = mergeSchemas([{ a: 1 }, { b: 2 }, { c: 3 }]);
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });
});

describe('mergeWithPriority', () => {
  it('highest priority wins on conflict', () => {
    const result = mergeWithPriority([
      { schema: { name: 'low' }, priority: 1 },
      { schema: { name: 'high' }, priority: 10 },
    ]);
    expect(result.name).toBe('high');
  });
});

describe('mergeAndDeduplicate', () => {
  it('deduplicates schemas by @id', () => {
    const schemas = [
      { '@id': 'id1', name: 'First' },
      { '@id': 'id1', name: 'Second', extra: true },
      { '@id': 'id2', name: 'Other' },
    ];
    const result = mergeAndDeduplicate(schemas);
    expect(result).toHaveLength(2);
  });

  it('keeps anonymous schemas', () => {
    const schemas = [{ name: 'A' }, { name: 'B' }];
    const result = mergeAndDeduplicate(schemas);
    expect(result).toHaveLength(2);
  });
});

describe('hasConflicts', () => {
  it('detects conflicts', () => {
    const { hasConflict, conflictingKeys } = hasConflicts({ a: 1, b: 2 }, { a: 99 });
    expect(hasConflict).toBe(true);
    expect(conflictingKeys).toContain('a');
  });

  it('returns no conflict when values match', () => {
    const { hasConflict } = hasConflicts({ a: 1 }, { a: 1 });
    expect(hasConflict).toBe(false);
  });

  it('ignores specified keys', () => {
    const { hasConflict } = hasConflicts({ a: 1 }, { a: 99 }, ['a']);
    expect(hasConflict).toBe(false);
  });
});
