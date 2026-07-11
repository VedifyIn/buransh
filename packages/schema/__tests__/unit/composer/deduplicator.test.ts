import { describe, it, expect } from 'vitest';
import { deduplicateGraph, countDuplicates, hasDuplicates } from '../../../composer/deduplicator';

describe('deduplicateGraph', () => {
  it('keeps unique nodes unchanged', () => {
    const graph = [
      { '@type': 'Person', '@id': 'id1', name: 'Alice' },
      { '@type': 'Organization', '@id': 'id2', name: 'Acme' },
    ];
    const result = deduplicateGraph(graph);
    expect(result).toHaveLength(2);
  });

  it('removes duplicate @id, first wins by default', () => {
    const graph = [
      { '@type': 'Person', '@id': 'id1', name: 'First' },
      { '@type': 'Person', '@id': 'id1', name: 'Second' },
    ];
    const result = deduplicateGraph(graph);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('First');
  });

  it('merges duplicates when merge=true', () => {
    const graph = [
      { '@type': 'Person', '@id': 'id1', name: 'First' },
      { '@type': 'Person', '@id': 'id1', url: 'https://example.com' },
    ];
    const result = deduplicateGraph(graph, { merge: true });
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('First');
    expect(result[0]!.url).toBe('https://example.com');
  });

  it('always keeps anonymous nodes (no @id)', () => {
    const graph = [
      { '@type': 'ImageObject', url: 'https://cdn.example.com/img.jpg' },
      { '@type': 'ImageObject', url: 'https://cdn.example.com/img2.jpg' },
    ];
    const result = deduplicateGraph(graph);
    expect(result).toHaveLength(2);
  });

  it('preserves ordering of first occurrence', () => {
    const graph = [
      { '@id': 'c' },
      { '@id': 'a' },
      { '@id': 'b' },
      { '@id': 'a' }, // duplicate
    ];
    const result = deduplicateGraph(graph);
    expect(result.map((n) => n['@id'])).toEqual(['c', 'a', 'b']);
  });
});

describe('countDuplicates', () => {
  it('returns 0 for no duplicates', () => {
    expect(countDuplicates([{ '@id': 'a' }, { '@id': 'b' }])).toBe(0);
  });

  it('counts each duplicate occurrence', () => {
    expect(countDuplicates([{ '@id': 'a' }, { '@id': 'a' }, { '@id': 'a' }, { '@id': 'b' }])).toBe(
      2,
    );
  });
});

describe('hasDuplicates', () => {
  it('returns false when no duplicates', () => {
    expect(hasDuplicates([{ '@id': 'a' }, { '@id': 'b' }])).toBe(false);
  });

  it('returns true when duplicates exist', () => {
    expect(hasDuplicates([{ '@id': 'a' }, { '@id': 'a' }])).toBe(true);
  });
});
