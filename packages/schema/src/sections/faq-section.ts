/**
 * FAQPage section schema generator
 * Google Rich Result: https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSectionOptions {
  id?: string;
  pageId?: string;
}

/**
 * Generate a FAQPage schema from an array of question/answer pairs.
 * Requires at least 2 items for Google Rich Results eligibility.
 */
export function generateFaqSection(items: FaqItem[], options: FaqSectionOptions = {}) {
  if (!items || items.length === 0) return undefined;

  return {
    '@type': 'FAQPage' as const,
    ...(options.id ? { '@id': options.id } : {}),
    ...(options.pageId ? { isPartOf: { '@type': 'WebPage' as const, '@id': options.pageId } } : {}),
    mainEntity: items.map((item) => ({
      '@type': 'Question' as const,
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: item.answer,
      },
    })),
  };
}
