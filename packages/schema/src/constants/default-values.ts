/**
 * Default field values and graph limits
 */

export const DEFAULT_VALUES = {
  language: 'en',
  siteName: 'Vedify',
  baseUrl: 'https://vedify.in',
  logoPath: '/logo.png',
  defaultImageWidth: 1200,
  defaultImageHeight: 630,
  maxHeadlineLength: 110,
  maxDescriptionLength: 200,
  maxKeywordsCount: 10,
  defaultRatingBest: 5,
  defaultRatingWorst: 1,
  defaultCurrency: 'INR',
  defaultCountry: 'IN',
  defaultRegion: 'IN',
} as const;

export const GRAPH_LIMITS = {
  maxNodes: 30,
  maxJsonSize: 20480, // 20KB in bytes
  maxGenerationMs: 10,
  maxCompositionMs: 20,
} as const;
