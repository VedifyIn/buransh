import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeUrl,
  sanitizeImage,
  sanitizeDate,
  sanitizeStringArray,
  sanitizeNumber,
  sanitizeRating,
  sanitizeFaq,
  sanitizeFaqArray,
  sanitizeVideo,
} from '../../../src/utils/sanitizer';

describe('sanitizeText', () => {
  it('strips HTML tags', () => {
    expect(sanitizeText('<b>Hello</b> world')).toBe('Hello world');
  });

  it('truncates to maxLength', () => {
    const long = 'a'.repeat(300);
    const result = sanitizeText(long, 200);
    expect(result.length).toBe(200);
    expect(result.endsWith('...')).toBe(true);
  });

  it('returns empty string for falsy input', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });
});

describe('sanitizeUrl', () => {
  it('accepts valid https URL', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
  });

  it('accepts valid http URL', () => {
    expect(sanitizeUrl('http://example.com/path')).toBe('http://example.com/path');
  });

  it('returns undefined for invalid URL', () => {
    expect(sanitizeUrl('not a url')).toBeUndefined();
  });

  it('returns undefined for empty input', () => {
    expect(sanitizeUrl('')).toBeUndefined();
  });
});

describe('sanitizeImage', () => {
  it('returns undefined when url is missing', () => {
    expect(sanitizeImage({ url: '' })).toBeUndefined();
  });

  it('returns undefined when url is not a valid URL', () => {
    expect(sanitizeImage({ url: 'not-a-url' })).toBeUndefined();
  });

  it('sanitizes a valid image', () => {
    const result = sanitizeImage({
      url: 'https://cdn.example.com/img.jpg',
      alt: 'Photo',
      width: 1200,
      height: 630,
    });
    expect(result).toBeDefined();
    expect(result!.url).toBe('https://cdn.example.com/img.jpg');
    expect(result!.width).toBe(1200);
  });

  it('strips negative dimensions', () => {
    const result = sanitizeImage({ url: 'https://cdn.example.com/img.jpg', width: -1, height: 0 });
    expect(result!.width).toBeUndefined();
    expect(result!.height).toBeUndefined();
  });
});

describe('sanitizeDate', () => {
  it('returns ISO date string', () => {
    expect(sanitizeDate('2025-01-15')).toBe('2025-01-15');
  });

  it('accepts datetime strings', () => {
    const result = sanitizeDate('2025-01-15T10:00:00Z');
    expect(result).toBe('2025-01-15');
  });

  it('returns undefined for invalid dates', () => {
    expect(sanitizeDate('not-a-date')).toBeUndefined();
    expect(sanitizeDate('')).toBeUndefined();
  });
});

describe('sanitizeStringArray', () => {
  it('filters non-strings', () => {
    // @ts-ignore — deliberate invalid input
    const result = sanitizeStringArray(['hello', 42, null, 'world']);
    expect(result).toEqual(['hello', 'world']);
  });

  it('filters empty strings', () => {
    expect(sanitizeStringArray(['hello', '', '   ', 'world'])).toEqual(['hello', 'world']);
  });
});

describe('sanitizeNumber', () => {
  it('clamps to min', () => {
    expect(sanitizeNumber(-5, 0, 10)).toBe(0);
  });

  it('clamps to max', () => {
    expect(sanitizeNumber(15, 0, 10)).toBe(10);
  });

  it('returns undefined for NaN', () => {
    expect(sanitizeNumber(NaN)).toBeUndefined();
  });
});

describe('sanitizeRating', () => {
  it('returns a valid rating object', () => {
    const result = sanitizeRating({ value: 4.5 });
    expect(result).toBeDefined();
    expect(result!.value).toBe(4.5);
    expect(result!.bestRating).toBe(5);
    expect(result!.worstRating).toBe(1);
  });

  it('returns undefined when value is missing', () => {
    // @ts-ignore
    expect(sanitizeRating({ bestRating: 5 })).toBeUndefined();
  });
});

describe('sanitizeFaq', () => {
  it('returns sanitized faq', () => {
    const result = sanitizeFaq({ question: 'What is X?', answer: 'X is Y.' });
    expect(result).toBeDefined();
    expect(result!.question).toBe('What is X?');
  });

  it('returns undefined if question is missing', () => {
    // @ts-ignore
    expect(sanitizeFaq({ answer: 'Y' })).toBeUndefined();
  });
});

describe('sanitizeFaqArray', () => {
  it('filters invalid items', () => {
    // @ts-ignore
    const result = sanitizeFaqArray([{ question: 'Q?', answer: 'A.' }, { question: '' }]);
    expect(result).toHaveLength(1);
  });
});

describe('sanitizeVideo', () => {
  it('sanitizes a valid video', () => {
    const result = sanitizeVideo({
      url: 'https://cdn.example.com/video.mp4',
      thumbnail: 'https://cdn.example.com/thumb.jpg',
    });
    expect(result).toBeDefined();
    expect(result!.url).toBe('https://cdn.example.com/video.mp4');
  });

  it('returns undefined when thumbnail is missing', () => {
    expect(sanitizeVideo({ url: 'https://cdn.example.com/v.mp4', thumbnail: '' })).toBeUndefined();
  });
});
