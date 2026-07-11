/**
 * Review section schema generator
 * Google Rich Result: https://developers.google.com/search/docs/appearance/structured-data/review-snippet
 */

export interface ReviewSectionData {
  itemName: string;
  itemType?: string;
  reviewBody?: string;
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
  author?: { '@id': string } | { '@type': 'Person'; name: string };
  datePublished?: string;
}

export interface ReviewSectionOptions {
  id?: string;
}

/**
 * Generate a Review schema suitable for Google Review Snippet rich results.
 */
export function generateReviewSection(data: ReviewSectionData, options: ReviewSectionOptions = {}) {
  return {
    '@type': 'Review' as const,
    ...(options.id ? { '@id': options.id } : {}),
    itemReviewed: {
      '@type': (data.itemType ?? 'Thing') as string,
      name: data.itemName,
    },
    reviewRating: {
      '@type': 'Rating' as const,
      ratingValue: data.ratingValue,
      bestRating: data.bestRating ?? 5,
      worstRating: data.worstRating ?? 1,
    },
    reviewBody: data.reviewBody,
    author: data.author,
    datePublished: data.datePublished,
  };
}
