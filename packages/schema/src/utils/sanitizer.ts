/**
 * Data sanitization utilities for schema generation
 */

/**
 * Sanitize text by stripping HTML tags and truncating to recommended lengths
 */
export function sanitizeText(text: string, maxLength: number = 200): string {
  if (!text) return '';

  // Strip HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength - 3) + '...';
  }

  return sanitized.trim();
}

/**
 * Sanitize a URL
 */
export function sanitizeUrl(url: string): string | undefined {
  if (!url) return undefined;

  try {
    // Try to parse as URL
    const parsed = new URL(url);

    // Ensure it's absolute
    if (!parsed.protocol || !parsed.host) {
      return undefined;
    }

    return parsed.toString();
  } catch {
    return undefined;
  }
}

/**
 * Sanitize an image object
 */
export function sanitizeImage(image: {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}):
  | {
      url: string;
      alt?: string;
      width?: number;
      height?: number;
    }
  | undefined {
  if (!image?.url) return undefined;

  const sanitizedUrl = sanitizeUrl(image.url);
  if (!sanitizedUrl) return undefined;

  return {
    url: sanitizedUrl,
    alt: image.alt ? sanitizeText(image.alt, 100) : undefined,
    width: image.width && image.width > 0 ? image.width : undefined,
    height: image.height && image.height > 0 ? image.height : undefined,
  };
}

/**
 * Sanitize a date string to ISO 8601 format
 */
export function sanitizeDate(date: string): string | undefined {
  if (!date) return undefined;

  try {
    // Try to parse as Date
    const parsed = new Date(date);

    // Check if valid
    if (isNaN(parsed.getTime())) {
      return undefined;
    }

    // Return ISO string (YYYY-MM-DD)
    return parsed.toISOString().split('T')[0];
  } catch {
    return undefined;
  }
}

/**
 * Sanitize an array of strings
 */
export function sanitizeStringArray(arr: string[]): string[] {
  if (!Array.isArray(arr)) return [];

  return arr
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => sanitizeText(item, 50));
}

/**
 * Sanitize a number within a range
 */
export function sanitizeNumber(num: number, min?: number, max?: number): number | undefined {
  if (typeof num !== 'number' || isNaN(num)) {
    return undefined;
  }

  let sanitized = num;

  if (min !== undefined && sanitized < min) {
    sanitized = min;
  }

  if (max !== undefined && sanitized > max) {
    sanitized = max;
  }

  return sanitized;
}

/**
 * Sanitize a rating object
 */
export function sanitizeRating(rating: {
  value: number;
  bestRating?: number;
  worstRating?: number;
}):
  | {
      value: number;
      bestRating: number;
      worstRating: number;
    }
  | undefined {
  if (!rating || typeof rating.value !== 'number') {
    return undefined;
  }

  const value = sanitizeNumber(rating.value, 0, 5);
  if (value === undefined) return undefined;

  return {
    value,
    bestRating: sanitizeNumber(rating.bestRating ?? 5, 1, 10) ?? 5,
    worstRating: sanitizeNumber(rating.worstRating ?? 1, 0, 1) ?? 1,
  };
}

/**
 * Sanitize a FAQ item
 */
export function sanitizeFaq(faq: { question: string; answer: string }):
  | {
      question: string;
      answer: string;
    }
  | undefined {
  if (!faq?.question || !faq?.answer) {
    return undefined;
  }

  const question = sanitizeText(faq.question, 150);
  const answer = sanitizeText(faq.answer, 500);

  if (!question || !answer) {
    return undefined;
  }

  return { question, answer };
}

/**
 * Sanitize an array of FAQ items
 */
export function sanitizeFaqArray(
  faqs: Array<{ question: string; answer: string }>,
): Array<{ question: string; answer: string }> {
  if (!Array.isArray(faqs)) return [];

  return faqs
    .map(sanitizeFaq)
    .filter((faq): faq is { question: string; answer: string } => faq !== undefined);
}

/**
 * Sanitize a video object
 */
export function sanitizeVideo(video: {
  url: string;
  thumbnail: string;
  duration?: string;
  transcript?: string;
  embedUrl?: string;
  uploadDate?: string;
}):
  | {
      url: string;
      thumbnail: string;
      duration?: string;
      transcript?: string;
      embedUrl?: string;
      uploadDate?: string;
    }
  | undefined {
  if (!video?.url || !video?.thumbnail) {
    return undefined;
  }

  const url = sanitizeUrl(video.url);
  const thumbnail = sanitizeUrl(video.thumbnail);

  if (!url || !thumbnail) {
    return undefined;
  }

  return {
    url,
    thumbnail,
    duration: video.duration ? sanitizeText(video.duration, 20) : undefined,
    transcript: video.transcript ? sanitizeText(video.transcript, 1000) : undefined,
    embedUrl: video.embedUrl ? sanitizeUrl(video.embedUrl) : undefined,
    uploadDate: video.uploadDate ? sanitizeDate(video.uploadDate) : undefined,
  };
}
