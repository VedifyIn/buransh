/**
 * Required and recommended fields per schema type.
 *
 * REQUIRED_FIELDS: minimum fields for Google Rich Results eligibility.
 * SCHEMA_REQUIRED_FIELDS: minimum fields for the schema to be structurally valid.
 * RECOMMENDED_FIELDS: fields that improve rich result eligibility but aren't mandatory.
 */

/** Minimum fields required for Google Rich Results */
export const REQUIRED_FIELDS: Record<string, string[]> = {
  Article: ['headline', 'author', 'datePublished', 'image'],
  BlogPosting: ['headline', 'author', 'datePublished', 'image'],
  TechArticle: ['headline', 'author', 'datePublished', 'image'],
  NewsArticle: ['headline', 'author', 'datePublished', 'image'],
  FAQPage: ['mainEntity'],
  Question: ['name', 'acceptedAnswer'],
  Answer: ['text'],
  HowTo: ['name', 'step'],
  HowToStep: ['text'],
  Recipe: ['name', 'image', 'author', 'recipeIngredient', 'recipeInstructions'],
  Review: ['reviewRating', 'itemReviewed', 'author'],
  AggregateRating: ['ratingValue', 'reviewCount'],
  Event: ['name', 'startDate', 'location'],
  JobPosting: ['title', 'description', 'datePosted', 'hiringOrganization'],
  Course: ['name', 'description', 'provider'],
  Book: ['name', 'author'],
  VideoObject: ['name', 'description', 'thumbnailUrl', 'uploadDate'],
  SoftwareApplication: ['name', 'operatingSystem', 'applicationCategory'],
  SoftwareSourceCode: ['name', 'author'],
  BreadcrumbList: ['itemListElement'],
  ListItem: ['position', 'name'],
  Organization: ['name'],
  Person: ['name'],
  WebSite: ['name', 'url'],
  WebPage: ['name', 'url'],
  ImageObject: ['url'],
  PostalAddress: ['addressLocality', 'addressCountry'],
};

/** Schema-structural required fields (independent of Google Rich Results) */
export const SCHEMA_REQUIRED_FIELDS: Record<string, readonly string[]> = {
  WebSite: ['url', 'name'],
  WebPage: ['url', 'name'],
  BreadcrumbList: ['itemListElement'],
  BlogPosting: ['headline', 'description', 'datePublished', 'author'],
  TechArticle: ['headline', 'description', 'author'],
  ScholarlyArticle: ['name', 'description', 'author'],
  Recipe: ['name', 'description', 'author'],
  Book: ['name'],
  Review: ['reviewRating.ratingValue', 'itemReviewed.name', 'author'],
  Course: ['name', 'description'],
  PodcastEpisode: ['name', 'description'],
  Quote: ['text', 'author.name'],
  Person: ['name'],
  Organization: ['name'],
  FAQPage: ['mainEntity'],
  HowTo: ['name', 'step'],
  SoftwareSourceCode: ['code', 'programmingLanguage'],
  OpinionNewsArticle: ['headline', 'author'],
  ItemList: ['itemListElement'],
  Event: ['name', 'startDate'],
  Hackathon: ['name', 'startDate'],
  Conference: ['name', 'startDate'],
  Webinar: ['name', 'startDate'],
  Meetup: ['name', 'startDate'],
  Workshop: ['name', 'startDate'],
  Competition: ['name', 'startDate'],
  Bootcamp: ['name', 'startDate'],
  JobPosting: ['title', 'description', 'datePosted', 'hiringOrganization.name'],
};

export const RECOMMENDED_FIELDS: Record<string, string[]> = {
  Article: ['description', 'dateModified', 'keywords', 'publisher'],
  BlogPosting: ['description', 'dateModified', 'keywords', 'publisher', 'wordCount'],
  Event: ['endDate', 'description', 'image', 'organizer', 'eventStatus', 'eventAttendanceMode'],
  JobPosting: ['validThrough', 'baseSalary', 'employmentType', 'educationRequirements'],
  Course: ['hasCourseInstance', 'educationalLevel', 'url'],
  Person: ['url', 'image', 'sameAs', 'description'],
  Organization: ['url', 'logo', 'sameAs', 'address'],
  VideoObject: ['contentUrl', 'duration', 'embedUrl'],
  SoftwareSourceCode: ['codeRepository', 'programmingLanguage', 'license'],
};

export function getRequiredFields(schemaType: string): string[] {
  return [...(SCHEMA_REQUIRED_FIELDS[schemaType] ?? [])];
}

export function getGoogleRequiredFields(schemaType: string): string[] {
  return [...(REQUIRED_FIELDS[schemaType] ?? [])];
}
