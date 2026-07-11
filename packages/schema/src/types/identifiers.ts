/**
 * ID generation types and patterns for schema.org entities
 */

export type EntityType =
  | 'Person'
  | 'Organization'
  | 'WebSite'
  | 'WebPage'
  | 'BlogPosting'
  | 'Article'
  | 'TechArticle'
  | 'Recipe'
  | 'Book'
  | 'Review'
  | 'Course'
  | 'PodcastEpisode'
  | 'ScholarlyArticle'
  | 'Quote'
  | 'Event'
  | 'Hackathon'
  | 'Conference'
  | 'Webinar'
  | 'Meetup'
  | 'Workshop'
  | 'Competition'
  | 'Bootcamp'
  | 'JobPosting'
  | 'Internship'
  | 'Certification'
  | 'SoftwareSourceCode'
  | 'CreativeWork'
  | 'ItemList'
  | 'SearchResultsPage'
  | 'CollectionPage'
  | 'SoftwareApplication'
  | 'FAQPage'
  | 'HowTo'
  | 'BreadcrumbList'
  | 'ImageObject'
  | 'VideoObject'
  | 'AudioObject'
  | 'PostalAddress'
  | 'GeoCoordinates'
  | 'Offer'
  | 'OpeningHoursSpecification';

export interface IdGenerationConfig {
  baseUrl: string;
  idSeparator?: string;
  fragmentSeparator?: string;
  useSlugs?: boolean;
}

export interface GeneratedId {
  entityType: EntityType;
  identifier: string;
  fullId: string;
  fragment?: string;
}

import { DEFAULT_VALUES } from '../constants/default-values';

export const DEFAULT_ID_CONFIG: IdGenerationConfig = {
  baseUrl: DEFAULT_VALUES.baseUrl,
  idSeparator: '/',
  fragmentSeparator: '#',
  useSlugs: true,
};

/**
 * ID patterns for different entity types
 */
export const ID_PATTERNS: Record<EntityType, string> = {
  Person: 'person',
  Organization: 'organization',
  WebSite: 'website',
  WebPage: 'webpage',
  BlogPosting: 'blog',
  Article: 'article',
  TechArticle: 'tech',
  Recipe: 'recipe',
  Book: 'book',
  Review: 'review',
  Course: 'course',
  PodcastEpisode: 'podcast',
  ScholarlyArticle: 'research',
  Quote: 'quote',
  Event: 'event',
  Hackathon: 'hackathon',
  Conference: 'conference',
  Webinar: 'webinar',
  Meetup: 'meetup',
  Workshop: 'workshop',
  Competition: 'competition',
  Bootcamp: 'bootcamp',
  JobPosting: 'job',
  Internship: 'internship',
  Certification: 'certification',
  SoftwareSourceCode: 'code',
  CreativeWork: 'project',
  ItemList: 'leaderboard',
  SearchResultsPage: 'search',
  CollectionPage: 'collection',
  SoftwareApplication: 'tool',
  FAQPage: 'faq',
  HowTo: 'howto',
  BreadcrumbList: 'breadcrumb',
  ImageObject: 'image',
  VideoObject: 'video',
  AudioObject: 'audio',
  PostalAddress: 'address',
  GeoCoordinates: 'geo',
  Offer: 'offer',
  OpeningHoursSpecification: 'hours',
};

/**
 * Validation patterns for IDs
 */
export const ID_VALIDATION_PATTERNS = {
  // Matches: https://domain.com/type#identifier
  FULL_ID: /^https?:\/\/[^\/]+\/[^#]+#[^#]+$/,

  // Matches: /type#identifier
  RELATIVE_ID: /^\/[^#]+#[^#]+$/,

  // Matches: #identifier
  FRAGMENT_ID: /^#[^#]+$/,
};

export type IdValidationResult = {
  isValid: boolean;
  error?: string;
  parsed?: {
    baseUrl: string;
    entityType: string;
    identifier: string;
  };
};
