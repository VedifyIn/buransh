/**
 * Case study section schema generator (Article subtype)
 */

export interface CaseStudySectionData {
  headline: string;
  description?: string;
  author?: { '@id': string } | { '@type': 'Person'; name: string };
  about?: { name: string; url?: string };
  datePublished?: string;
  image?: string;
  url?: string;
}

export interface CaseStudySectionOptions {
  id?: string;
}

/**
 * Generate an Article schema for case study content.
 */
export function generateCaseStudySection(
  data: CaseStudySectionData,
  options: CaseStudySectionOptions = {},
) {
  return {
    '@type': 'Article' as const,
    ...(options.id ? { '@id': options.id } : {}),
    headline: data.headline,
    description: data.description,
    author: data.author,
    about: data.about
      ? { '@type': 'Thing' as const, name: data.about.name, url: data.about.url }
      : undefined,
    datePublished: data.datePublished,
    image: data.image ? { '@type': 'ImageObject' as const, url: data.image } : undefined,
    url: data.url,
    articleSection: 'Case Study',
  };
}
