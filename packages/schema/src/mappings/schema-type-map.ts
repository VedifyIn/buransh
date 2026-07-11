import type { ContentType } from '../enums';

export const CONTENT_TO_SCHEMA_TYPE: Record<ContentType, string | undefined> = {
  BlogPost: 'BlogPosting',
  Essay: 'BlogPosting',
  Opinion: 'OpinionNewsArticle',
  Devotional: 'Article',
  ShortStory: 'Article',
  Folktale: 'Article',
  Gist: 'Article',
  QuickNote: 'Article',
  SeriesOverview: 'CollectionPage',
  Course: 'Course',
  CourseLesson: 'Course',
  Book: 'Book',
  BookReview: 'Review',
  Recipe: 'Recipe',
  Quote: 'Quote',
  ResearchPaper: 'ScholarlyArticle',
  Patent: 'Patent',
  Tutorial: 'TechArticle',
  CodeSnippet: 'SoftwareSourceCode',
  PodcastEpisode: 'PodcastEpisode',
  Lyrics: 'MusicComposition',
  LegalPage: undefined,
  AboutMe: 'ProfilePage',
};

export function getSchemaType(type: ContentType): string | undefined {
  return CONTENT_TO_SCHEMA_TYPE[type];
}
