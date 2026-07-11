export const GOOGLE_RICH_RESULT_TYPES = {
  BlogPosting: 'article',
  TechArticle: 'article',
  ScholarlyArticle: 'article',
  OpinionNewsArticle: 'article',
  FAQPage: 'faq',
  HowTo: 'how-to',
  Review: 'review-snippet',
  Event: 'event',
  Hackathon: 'event',
  Conference: 'event',
  Webinar: 'event',
  Meetup: 'event',
  Workshop: 'event',
  Competition: 'event',
  Bootcamp: 'event',
  JobPosting: 'job-posting',
  Course: 'course',
} as const;

export function isGoogleRichResultType(schemaType: string): boolean {
  return schemaType in GOOGLE_RICH_RESULT_TYPES;
}
