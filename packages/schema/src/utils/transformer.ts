/**
 * Data transformation utilities for schema generation
 */

import type { EntityType } from '../types/identifiers';
import { generateSchemaId } from './id-generator';

/**
 * Transform frontmatter data to schema-ready format
 */
export function transformToSchema<T extends Record<string, any>>(
  data: T,
  entityType: EntityType,
  baseUrl: string,
): T & { '@id'?: string; '@type': string } {
  // Generate ID if we have an identifier
  const identifier = data.id || data.slug || data.title;
  let idField: { '@id'?: string } = {};

  if (identifier) {
    const generatedId = generateSchemaId(entityType, identifier, { baseUrl });
    idField = { '@id': generatedId.fullId };
  }

  // Transform common fields
  const transformed: any = { ...data };

  // Ensure @type is set
  transformed['@type'] = entityType;

  // Transform dates to ISO format
  if (data.datePublished) {
    transformed.datePublished = transformDate(data.datePublished);
  }

  if (data.dateModified) {
    transformed.dateModified = transformDate(data.dateModified);
  }

  // Transform image if present
  if (data.image) {
    transformed.image = transformImage(data.image, baseUrl);
  }

  // Transform video if present
  if (data.video) {
    transformed.video = transformVideo(data.video, baseUrl);
  }

  // Transform FAQ if present
  if (data.faqs && Array.isArray(data.faqs)) {
    transformed.faqs = transformFaqArray(data.faqs);
  }

  // Merge the ID field
  return { ...transformed, ...idField };
}

/**
 * Transform a date string to ISO 8601 format
 */
export function transformDate(date: string): string | undefined {
  if (!date) return undefined;

  try {
    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      return undefined;
    }

    return parsed.toISOString().split('T')[0];
  } catch {
    return undefined;
  }
}

/**
 * Transform an image object
 */
export function transformImage(
  image: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  },
  baseUrl: string,
):
  | {
      '@type': 'ImageObject';
      url: string;
      caption?: string;
      width?: number;
      height?: number;
    }
  | undefined {
  if (!image?.url) return undefined;

  // Make URL absolute if relative
  let url = image.url;
  if (!url.startsWith('http')) {
    url = `${baseUrl.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  }

  return {
    '@type': 'ImageObject',
    url,
    caption: image.alt,
    width: image.width,
    height: image.height,
  };
}

/**
 * Transform a video object
 */
export function transformVideo(
  video: {
    url: string;
    thumbnail: string;
    duration?: string;
    transcript?: string;
    embedUrl?: string;
    uploadDate?: string;
  },
  baseUrl: string,
):
  | {
      '@type': 'VideoObject';
      name?: string;
      description?: string;
      thumbnailUrl: string;
      uploadDate?: string;
      duration?: string;
      embedUrl?: string;
      contentUrl?: string;
      transcript?: string;
    }
  | undefined {
  if (!video?.url || !video?.thumbnail) {
    return undefined;
  }

  // Make URLs absolute if relative
  let url = video.url;
  let thumbnailUrl = video.thumbnail;

  if (!url.startsWith('http')) {
    url = `${baseUrl.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  }

  if (!thumbnailUrl.startsWith('http')) {
    thumbnailUrl = `${baseUrl.replace(/\/+$/, '')}/${thumbnailUrl.replace(/^\/+/, '')}`;
  }

  let embedUrl = video.embedUrl;
  if (embedUrl && !embedUrl.startsWith('http')) {
    embedUrl = `${baseUrl.replace(/\/+$/, '')}/${embedUrl.replace(/^\/+/, '')}`;
  }

  return {
    '@type': 'VideoObject',
    thumbnailUrl,
    uploadDate: video.uploadDate ? transformDate(video.uploadDate) : undefined,
    duration: video.duration,
    embedUrl,
    contentUrl: url,
    transcript: video.transcript,
  };
}

/**
 * Transform a FAQ array
 */
export function transformFaqArray(faqs: Array<{ question: string; answer: string }>): Array<{
  '@type': 'Question';
  name: string;
  acceptedAnswer: {
    '@type': 'Answer';
    text: string;
  };
}> {
  if (!Array.isArray(faqs)) return [];

  return faqs
    .filter((faq) => faq?.question && faq?.answer)
    .map((faq) => ({
      '@type': 'Question' as const,
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: faq.answer,
      },
    }));
}

/**
 * Transform a person object
 */
export function transformPerson(
  person: {
    name: string;
    url?: string;
    avatar?: string;
    sameAs?: string[];
  },
  baseUrl: string,
): {
  '@type': 'Person';
  '@id'?: string;
  name: string;
  url?: string;
  image?: string;
  sameAs?: string[];
} {
  const result: any = {
    '@type': 'Person',
    name: person.name,
  };

  // Generate ID from name
  if (person.name) {
    const generatedId = generateSchemaId('Person', person.name, { baseUrl });
    result['@id'] = generatedId.fullId;
  }

  // Transform URL
  if (person.url) {
    result.url = person.url.startsWith('http')
      ? person.url
      : `${baseUrl.replace(/\/+$/, '')}/${person.url.replace(/^\/+/, '')}`;
  }

  // Transform avatar
  if (person.avatar) {
    result.image = person.avatar.startsWith('http')
      ? person.avatar
      : `${baseUrl.replace(/\/+$/, '')}/${person.avatar.replace(/^\/+/, '')}`;
  }

  // Transform social profiles
  if (person.sameAs && Array.isArray(person.sameAs)) {
    result.sameAs = person.sameAs.filter(
      (url) => url && typeof url === 'string' && url.startsWith('http'),
    );
  }

  return result;
}

/**
 * Transform an organization object
 */
export function transformOrganization(
  organization: {
    name: string;
    url?: string;
    logo?: string;
    sameAs?: string[];
  },
  baseUrl: string,
): {
  '@type': 'Organization';
  '@id'?: string;
  name: string;
  url?: string;
  logo?: {
    '@type': 'ImageObject';
    url: string;
  };
  sameAs?: string[];
} {
  const result: any = {
    '@type': 'Organization',
    name: organization.name,
  };

  // Generate ID from name
  if (organization.name) {
    const generatedId = generateSchemaId('Organization', organization.name, { baseUrl });
    result['@id'] = generatedId.fullId;
  }

  // Transform URL
  if (organization.url) {
    result.url = organization.url.startsWith('http')
      ? organization.url
      : `${baseUrl.replace(/\/+$/, '')}/${organization.url.replace(/^\/+/, '')}`;
  }

  // Transform logo
  if (organization.logo) {
    result.logo = {
      '@type': 'ImageObject',
      url: organization.logo.startsWith('http')
        ? organization.logo
        : `${baseUrl.replace(/\/+$/, '')}/${organization.logo.replace(/^\/+/, '')}`,
    };
  }

  // Transform social profiles
  if (organization.sameAs && Array.isArray(organization.sameAs)) {
    result.sameAs = organization.sameAs.filter(
      (url) => url && typeof url === 'string' && url.startsWith('http'),
    );
  }

  return result;
}

/**
 * Transform a rating object
 */
export function transformRating(rating: {
  value: number;
  bestRating?: number;
  worstRating?: number;
}):
  | {
      '@type': 'Rating';
      ratingValue: number;
      bestRating: number;
      worstRating: number;
    }
  | undefined {
  if (!rating || typeof rating.value !== 'number') {
    return undefined;
  }

  return {
    '@type': 'Rating',
    ratingValue: rating.value,
    bestRating: rating.bestRating ?? 5,
    worstRating: rating.worstRating ?? 1,
  };
}

/**
 * Transform a list of items
 */
export function transformItemList<T>(
  items: T[],
  itemTransformer: (item: T, index: number) => any,
): Array<{
  '@type': 'ListItem';
  position: number;
  item: any;
}> {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => ({
      '@type': 'ListItem' as const,
      position: index + 1,
      item: itemTransformer(item, index),
    }))
    .filter((item) => item.item !== undefined);
}
