import { describe, it, expect } from 'vitest';
import {
  generateSchemaId,
  generateCollectionIds,
  validateSchemaId,
  resolveId,
  slugify,
  extractEntityType,
  extractIdentifier,
} from '../../../src/utils/id-generator';

describe('slugify', () => {
  it('lowercases text', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with dashes', () => {
    expect(slugify('foo bar baz')).toBe('foo-bar-baz');
  });

  it('strips special characters', () => {
    expect(slugify('hello! world?')).toBe('hello-world');
  });

  it('collapses multiple dashes', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('trims leading/trailing dashes', () => {
    expect(slugify('-hello-')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('generateSchemaId', () => {
  it('generates a full URL for Person entity', () => {
    const result = generateSchemaId('Person', 'vaidic', { baseUrl: 'https://vedify.in' });
    expect(result.fullId).toBe('https://vedify.in/person#vaidic');
    expect(result.entityType).toBe('Person');
    expect(result.identifier).toBe('vaidic');
  });

  it('slugifies the identifier', () => {
    const result = generateSchemaId('BlogPosting', 'My First Post', {
      baseUrl: 'https://vedify.in',
    });
    expect(result.fullId).toBe('https://vedify.in/blog#my-first-post');
  });

  it('strips trailing slash from base URL', () => {
    const result = generateSchemaId('Person', 'vaidic', { baseUrl: 'https://vedify.in/' });
    expect(result.fullId).toMatch(/^https:\/\/vedify\.in\//);
    expect(result.fullId).not.toContain('//person');
  });

  it('works for Event entity type', () => {
    const result = generateSchemaId('Event', 'hackathon-2025', { baseUrl: 'https://vedify.in' });
    expect(result.fullId).toBe('https://vedify.in/event#hackathon-2025');
  });
});

describe('generateCollectionIds', () => {
  it('generates unique IDs for multiple identifiers', () => {
    const ids = generateCollectionIds('Person', ['alice', 'bob', 'carol'], {
      baseUrl: 'https://vedify.in',
    });
    expect(ids.size).toBe(3);
    expect(ids.get('alice')!.fullId).toBe('https://vedify.in/person#alice');
    expect(ids.get('bob')!.fullId).toBe('https://vedify.in/person#bob');
  });

  it('throws on collision after slugification', () => {
    expect(() =>
      generateCollectionIds('Person', ['Hello World', 'hello world'], {
        baseUrl: 'https://vedify.in',
      }),
    ).toThrow('ID collision');
  });
});

describe('validateSchemaId', () => {
  it('validates a full HTTPS id', () => {
    const result = validateSchemaId('https://vedify.in/person#vaidic');
    expect(result.isValid).toBe(true);
  });

  it('invalidates a malformed URL', () => {
    const result = validateSchemaId('not-a-url');
    expect(result.isValid).toBe(false);
  });

  it('validates a fragment id', () => {
    const result = validateSchemaId('#author');
    expect(result.isValid).toBe(true);
  });
});

describe('resolveId', () => {
  it('returns absolute IDs unchanged', () => {
    const id = 'https://vedify.in/person#vaidic';
    expect(resolveId(id, 'https://vedify.in')).toBe(id);
  });

  it('throws on invalid id', () => {
    expect(() => resolveId('not-valid', 'https://vedify.in')).toThrow();
  });
});

describe('extractEntityType', () => {
  it('extracts entity type from full id', () => {
    const type = extractEntityType('https://vedify.in/person#vaidic');
    expect(type).toBe('Person');
  });

  it('returns null for invalid id', () => {
    expect(extractEntityType('garbage')).toBeNull();
  });
});

describe('extractIdentifier', () => {
  it('extracts identifier from full id', () => {
    const id = extractIdentifier('https://vedify.in/person#vaidic');
    expect(id).toBe('vaidic');
  });
});
