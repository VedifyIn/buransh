import { describe, it, expect } from 'vitest';
import {
  SCHEMA_PRIORITY,
  sortByPriority,
  extractSortedSchemas,
  getPriority,
} from '../../../composer/priority-map';

describe('SCHEMA_PRIORITY', () => {
  it('WEBSITE has the lowest priority number (comes first)', () => {
    expect(SCHEMA_PRIORITY.WEBSITE).toBe(1);
  });

  it('WEBPAGE comes after WEBSITE', () => {
    expect(SCHEMA_PRIORITY.WEBPAGE).toBeGreaterThan(SCHEMA_PRIORITY.WEBSITE);
  });

  it('BREADCRUMB comes after WEBPAGE', () => {
    expect(SCHEMA_PRIORITY.BREADCRUMB).toBeGreaterThan(SCHEMA_PRIORITY.WEBPAGE);
  });

  it('all content types are after identity layer', () => {
    const identityMax = 9;
    expect(SCHEMA_PRIORITY.BLOG_POSTING).toBeGreaterThan(identityMax);
    expect(SCHEMA_PRIORITY.HACKATHON).toBeGreaterThan(identityMax);
    expect(SCHEMA_PRIORITY.JOB_POSTING).toBeGreaterThan(identityMax);
    expect(SCHEMA_PRIORITY.COURSE).toBeGreaterThan(identityMax);
  });

  it('FAQ section is after content types', () => {
    expect(SCHEMA_PRIORITY.FAQ_SECTION).toBeGreaterThan(SCHEMA_PRIORITY.BLOG_POSTING);
  });

  it('people come after sections', () => {
    expect(SCHEMA_PRIORITY.AUTHOR).toBeGreaterThan(SCHEMA_PRIORITY.FAQ_SECTION);
  });

  it('media comes after people', () => {
    expect(SCHEMA_PRIORITY.VIDEO).toBeGreaterThan(SCHEMA_PRIORITY.ORGANIZATION);
  });

  it('engagement comes last', () => {
    const reviewPriority = SCHEMA_PRIORITY.REVIEW;
    expect(reviewPriority).toBeGreaterThan(SCHEMA_PRIORITY.VIDEO);
  });
});

describe('sortByPriority', () => {
  it('sorts ascending by priority', () => {
    const items = [
      { priority: 63, schema: { '@type': 'Organization' } },
      { priority: 1, schema: { '@type': 'WebSite' } },
      { priority: 40, schema: { '@type': 'BlogPosting' } },
    ];
    const sorted = sortByPriority(items);
    expect(sorted.map((i) => i.priority)).toEqual([1, 40, 63]);
  });

  it('is stable — same-priority items keep original order', () => {
    const items = [
      { priority: 40, schema: { '@type': 'A' } },
      { priority: 40, schema: { '@type': 'B' } },
    ];
    const sorted = sortByPriority(items);
    expect(sorted[0]!.schema['@type']).toBe('A');
    expect(sorted[1]!.schema['@type']).toBe('B');
  });

  it('does not mutate the original array', () => {
    const items = [
      { priority: 5, schema: {} },
      { priority: 1, schema: {} },
    ];
    const copy = [...items];
    sortByPriority(items);
    expect(items[0]!.priority).toBe(copy[0]!.priority);
  });
});

describe('extractSortedSchemas', () => {
  it('returns only schema objects in sorted order', () => {
    const items = [
      { priority: 63, schema: { '@type': 'Organization' } },
      { priority: 2, schema: { '@type': 'WebPage' } },
    ];
    const schemas = extractSortedSchemas(items);
    expect(schemas[0]!['@type']).toBe('WebPage');
    expect(schemas[1]!['@type']).toBe('Organization');
  });
});

describe('getPriority', () => {
  it('returns known priority', () => {
    expect(getPriority('WEBSITE')).toBe(1);
  });

  it('is case-insensitive', () => {
    expect(getPriority('website')).toBe(1);
  });

  it('returns fallback for unknown key', () => {
    expect(getPriority('UNKNOWN_TYPE', 42)).toBe(42);
  });
});
