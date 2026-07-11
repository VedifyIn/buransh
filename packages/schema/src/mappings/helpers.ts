import type { ContentType } from '../enums';
import { CONTENT_SEMANTIC_TAGS, type SemanticTags } from './semantic-tags';
import { CONTENT_TO_SCHEMA_TYPE, getSchemaType } from './schema-type-map';
import { CONTENT_TYPE_FLAGS } from './content-type-flags';

export function getSemanticTags(type: ContentType): SemanticTags {
  const tags = CONTENT_SEMANTIC_TAGS[type];
  if (!tags) {
    throw new Error(`Unknown content type: "${type}"`);
  }
  return tags;
}

export function getContainerTag(type: ContentType): string {
  return getSemanticTags(type).container;
}

export function getSchemaTypeForContent(type: ContentType): string | undefined {
  return getSchemaType(type);
}

export function isValidContentType(type: string): type is ContentType {
  return type in CONTENT_TO_SCHEMA_TYPE;
}

export function getOgType(type: ContentType): 'article' | 'website' {
  return CONTENT_TYPE_FLAGS[type]?.ogType ?? 'website';
}

export function hasAeoDirectAnswer(type: ContentType): boolean {
  return CONTENT_TYPE_FLAGS[type]?.hasAeo ?? false;
}

export function hasFaq(type: ContentType): boolean {
  return CONTENT_TYPE_FLAGS[type]?.hasFaq ?? false;
}

export function getContentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    BlogPost: 'Posts',
    Tutorial: 'Tutorials',
    Course: 'Courses',
    CourseLesson: 'Lessons',
    SeriesOverview: 'Series',
    Book: 'Books',
    BookReview: 'Reviews',
    Recipe: 'Recipes',
    Quote: 'Quotes',
    PodcastEpisode: 'Podcasts',
    ResearchPaper: 'Papers',
    Patent: 'Patents',
    LegalPage: 'Legal',
    AboutMe: 'About',
    CodeSnippet: 'Snippets',
    ShortStory: 'Stories',
    Folktale: 'Folktales',
    Gist: 'Gists',
    QuickNote: 'Notes',
    Devotional: 'Devotionals',
    Essay: 'Essays',
    Opinion: 'Opinions',
  };
  return labels[type] ?? type;
}
