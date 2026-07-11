import { describe, it, expect } from 'vitest';
import {
  transformDate,
  transformImage,
  transformVideo,
  transformFaqArray,
  transformPerson,
  transformOrganization,
  transformRating,
  transformItemList,
} from '../../../src/utils/transformer';

const BASE_URL = 'https://vedify.in';

describe('transformDate', () => {
  it('returns ISO YYYY-MM-DD from a valid date', () => {
    expect(transformDate('2025-06-01')).toBe('2025-06-01');
  });

  it('returns YYYY-MM-DD from a datetime string', () => {
    expect(transformDate('2025-06-01T12:00:00Z')).toBe('2025-06-01');
  });

  it('returns undefined for invalid dates', () => {
    expect(transformDate('not-a-date')).toBeUndefined();
    expect(transformDate('')).toBeUndefined();
  });
});

describe('transformImage', () => {
  it('returns an ImageObject schema', () => {
    const result = transformImage(
      { url: 'https://cdn.example.com/img.jpg', alt: 'Test', width: 1200, height: 630 },
      BASE_URL,
    );
    expect(result?.['@type']).toBe('ImageObject');
    expect(result?.url).toBe('https://cdn.example.com/img.jpg');
    expect(result?.caption).toBe('Test');
  });

  it('makes relative URLs absolute', () => {
    const result = transformImage({ url: '/images/test.jpg' }, BASE_URL);
    expect(result?.url).toBe('https://vedify.in/images/test.jpg');
  });

  it('returns undefined for empty URL', () => {
    expect(transformImage({ url: '' }, BASE_URL)).toBeUndefined();
  });
});

describe('transformVideo', () => {
  it('returns a VideoObject schema', () => {
    const result = transformVideo(
      { url: 'https://cdn.example.com/v.mp4', thumbnail: 'https://cdn.example.com/t.jpg' },
      BASE_URL,
    );
    expect(result?.['@type']).toBe('VideoObject');
    expect(result?.contentUrl).toBe('https://cdn.example.com/v.mp4');
  });

  it('returns undefined when thumbnail is missing', () => {
    expect(
      transformVideo({ url: 'https://cdn.example.com/v.mp4', thumbnail: '' }, BASE_URL),
    ).toBeUndefined();
  });
});

describe('transformFaqArray', () => {
  it('converts FAQ objects to Question/Answer schema', () => {
    const result = transformFaqArray([{ question: 'What is X?', answer: 'X is Y.' }]);
    expect(result).toHaveLength(1);
    expect(result[0]!['@type']).toBe('Question');
    expect(result[0]!.acceptedAnswer?.['@type']).toBe('Answer');
  });

  it('filters items missing question or answer', () => {
    // @ts-ignore
    const result = transformFaqArray([{ question: '' }, { question: 'Q?', answer: 'A.' }]);
    expect(result).toHaveLength(1);
  });
});

describe('transformPerson', () => {
  it('returns a Person schema with @id', () => {
    const result = transformPerson({ name: 'Alice', url: 'https://alice.dev' }, BASE_URL);
    expect(result['@type']).toBe('Person');
    expect(result['@id']).toBeDefined();
    expect(result.url).toBe('https://alice.dev');
  });

  it('makes avatar URL absolute', () => {
    const result = transformPerson({ name: 'Alice', avatar: '/img/alice.jpg' }, BASE_URL);
    expect(result.image).toBe('https://vedify.in/img/alice.jpg');
  });

  it('filters non-http sameAs entries', () => {
    const result = transformPerson(
      { name: 'Alice', sameAs: ['https://twitter.com/alice', 'not-a-url'] },
      BASE_URL,
    );
    expect(result.sameAs).toHaveLength(1);
  });
});

describe('transformOrganization', () => {
  it('returns an Organization schema', () => {
    const result = transformOrganization({ name: 'Vedify', url: 'https://vedify.in' }, BASE_URL);
    expect(result['@type']).toBe('Organization');
    expect(result.name).toBe('Vedify');
  });

  it('wraps logo in ImageObject', () => {
    const result = transformOrganization(
      { name: 'Org', logo: 'https://org.com/logo.png' },
      BASE_URL,
    );
    expect(result.logo?.['@type']).toBe('ImageObject');
  });
});

describe('transformRating', () => {
  it('returns a Rating schema', () => {
    const result = transformRating({ value: 4.5 });
    expect(result?.['@type']).toBe('Rating');
    expect(result?.ratingValue).toBe(4.5);
    expect(result?.bestRating).toBe(5);
  });

  it('returns undefined for invalid value', () => {
    // @ts-ignore
    expect(transformRating({ value: 'five' })).toBeUndefined();
  });
});

describe('transformItemList', () => {
  it('wraps items in ListItem schema', () => {
    const result = transformItemList(['a', 'b', 'c'], (item) => ({ name: item }));
    expect(result).toHaveLength(3);
    expect(result[0]!['@type']).toBe('ListItem');
    expect(result[0]!.position).toBe(1);
    expect(result[2]!.position).toBe(3);
  });

  it('filters items where transformer returns undefined', () => {
    const result = transformItemList(['a', null, 'c'], (item) => item ?? undefined);
    expect(result).toHaveLength(2);
  });
});
