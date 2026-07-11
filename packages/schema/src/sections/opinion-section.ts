/**
 * Opinion section schema generator (OpinionNewsArticle)
 */

export interface OpinionSectionData {
  headline: string;
  description?: string;
  author?: { '@id': string } | { '@type': 'Person'; name: string };
  datePublished?: string;
  dateModified?: string;
  image?: string;
  url?: string;
  publisher?: { '@id': string } | { '@type': 'Organization'; name: string };
}

export interface OpinionSectionOptions {
  id?: string;
}

/**
 * Generate an OpinionNewsArticle schema for editorial/opinion posts.
 */
export function generateOpinionSection(
  data: OpinionSectionData,
  options: OpinionSectionOptions = {},
) {
  return {
    '@type': 'OpinionNewsArticle' as const,
    ...(options.id ? { '@id': options.id } : {}),
    headline: data.headline,
    description: data.description,
    author: data.author,
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    image: data.image ? { '@type': 'ImageObject' as const, url: data.image } : undefined,
    url: data.url,
    publisher: data.publisher,
  };
}
