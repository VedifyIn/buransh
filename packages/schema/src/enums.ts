import { z } from 'zod';

export const contentTypeSchema = z.enum([
  'BlogPost',
  'Essay',
  'Opinion',
  'Tutorial',
  'CodeSnippet',
  'ShortStory',
  'Folktale',
  'Gist',
  'QuickNote',
  'SeriesOverview',
  'Course',
  'CourseLesson',
  'Devotional',
  'Book',
  'BookReview',
  'Recipe',
  'Quote',
  'ResearchPaper',
  'Patent',
  'LegalPage',
  'AboutMe',
  'PodcastEpisode',
  'Lyrics',
]);

export const difficultySchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);
export const twitterCardSchema = z.enum(['summary', 'summary_large_image', 'app', 'player']);
export const dietSchema = z.enum([
  'DiabeticDiet',
  'GlutenFreeDiet',
  'HalalDiet',
  'VeganDiet',
  'VegetarianDiet',
]);
export const seoPrioritySchema = z.enum(['low', 'medium', 'high']);

export const statusSchema = z.enum(['draft', 'published', 'archived']);
export const intentSchema = z.enum(['understand', 'implement', 'debug', 'reference']);
export const topicSchema = z.string();

export type ContentType = z.infer<typeof contentTypeSchema>;
export type Status = z.infer<typeof statusSchema>;
export type Intent = z.infer<typeof intentSchema>;
export type Topic = string;
