export const SCHEMA_TYPES = {
  WEBSITE: 'WebSite',
  WEBPAGE: 'WebPage',
  BREADCRUMB: 'BreadcrumbList',
  BLOG_POSTING: 'BlogPosting',
  TECH_ARTICLE: 'TechArticle',
  SCHOLARLY_ARTICLE: 'ScholarlyArticle',
  RECIPE: 'Recipe',
  BOOK: 'Book',
  REVIEW: 'Review',
  COURSE: 'Course',
  PODCAST_EPISODE: 'PodcastEpisode',
  QUOTE: 'Quote',
  PERSON: 'Person',
  ORGANIZATION: 'Organization',
  FAQ: 'FAQPage',
  HOW_TO: 'HowTo',
  CODE: 'SoftwareSourceCode',
  OPINION: 'OpinionNewsArticle',
  ITEM_LIST: 'ItemList',
  IMAGE: 'ImageObject',
  VIDEO: 'VideoObject',
  AUDIO: 'AudioObject',
  EVENT: 'Event',
  HACKATHON: 'Hackathon',
  CONFERENCE: 'Conference',
  WEBINAR: 'Webinar',
  MEETUP: 'Meetup',
  WORKSHOP: 'Workshop',
  COMPETITION: 'Competition',
  BOOTCAMP: 'Bootcamp',
  JOB_POSTING: 'JobPosting',
} as const;

export type KnownSchemaType = (typeof SCHEMA_TYPES)[keyof typeof SCHEMA_TYPES];

export const EVENT_SCHEMA_TYPES = [
  SCHEMA_TYPES.EVENT,
  SCHEMA_TYPES.HACKATHON,
  SCHEMA_TYPES.CONFERENCE,
  SCHEMA_TYPES.WEBINAR,
  SCHEMA_TYPES.MEETUP,
  SCHEMA_TYPES.WORKSHOP,
  SCHEMA_TYPES.COMPETITION,
  SCHEMA_TYPES.BOOTCAMP,
] as const;

export const BLOG_SECTION_SCHEMA_TYPES = [
  SCHEMA_TYPES.FAQ,
  SCHEMA_TYPES.HOW_TO,
  SCHEMA_TYPES.CODE,
  SCHEMA_TYPES.OPINION,
  SCHEMA_TYPES.REVIEW,
] as const;
