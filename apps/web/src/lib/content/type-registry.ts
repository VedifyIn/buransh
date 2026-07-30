import type { Component } from 'astro/runtime/server/render/astro-framework-component';
import EssayLayout from '@/layouts/content/EssayLayout.astro';
import BookLayout from '@/layouts/content/BookLayout.astro';
import BookReviewLayout from '@/layouts/content/BookReviewLayout.astro';
import RecipeLayout from '@/layouts/content/RecipeLayout.astro';
import TutorialLayout from '@/layouts/content/TutorialLayout.astro';
import ResearchPaperLayout from '@/layouts/content/ResearchPaperLayout.astro';
import PatentLayout from '@/layouts/content/PatentLayout.astro';
import PodcastLayout from '@/layouts/content/PodcastLayout.astro';
import QuoteLayout from '@/layouts/content/QuoteLayout.astro';
import CourseLayout from '@/layouts/content/CourseLayout.astro';
import CourseLessonLayout from '@/layouts/content/CourseLessonLayout.astro';
import EventLayout from '@/layouts/content/EventLayout.astro';
import ConferenceLayout from '@/layouts/content/ConferenceLayout.astro';
import WebinarLayout from '@/layouts/content/WebinarLayout.astro';
import WorkshopLayout from '@/layouts/content/WorkshopLayout.astro';
import ContentLayout from '@/layouts/ContentLayout.astro';

export interface TypeInfo {
  schemaType: string;
  urlSegment: string;
  label: string;
  icon: string;
  layout: Component;
  accentClass?: string;
  layoutProps?: Record<string, unknown>;
}

const typeRegistry: Record<string, TypeInfo> = {
  Essay: {
    schemaType: 'Essay',
    urlSegment: 'essay',
    label: 'Essays',
    icon: 'file-text',
    layout: EssayLayout,
    accentClass: 'from-primary to-secondary',
  },
  Book: {
    schemaType: 'Book',
    urlSegment: 'book',
    label: 'Books',
    icon: 'book',
    layout: BookLayout,
    accentClass: 'from-accent to-primary',
  },
  BookReview: {
    schemaType: 'BookReview',
    urlSegment: 'book-review',
    label: 'Book Reviews',
    icon: 'book-open-check',
    layout: BookReviewLayout,
    accentClass: 'from-secondary to-accent',
  },
  Recipe: {
    schemaType: 'Recipe',
    urlSegment: 'recipe',
    label: 'Recipes',
    icon: 'utensils-crossed',
    layout: RecipeLayout,
    accentClass: 'from-error to-warning',
  },
  Tutorial: {
    schemaType: 'Tutorial',
    urlSegment: 'tutorial',
    label: 'Tutorials',
    icon: 'graduation-cap',
    layout: TutorialLayout,
    accentClass: 'from-info to-primary',
  },
  ResearchPaper: {
    schemaType: 'ResearchPaper',
    urlSegment: 'research-paper',
    label: 'Research Papers',
    icon: 'scroll-text',
    layout: ResearchPaperLayout,
    accentClass: 'from-violet-600 to-purple-600',
  },
  Patent: {
    schemaType: 'Patent',
    urlSegment: 'patent',
    label: 'Patents',
    icon: 'copyright',
    layout: PatentLayout,
    accentClass: 'from-slate-700 to-slate-900',
  },
  PodcastEpisode: {
    schemaType: 'PodcastEpisode',
    urlSegment: 'podcast',
    label: 'Podcasts',
    icon: 'podcast',
    layout: PodcastLayout,
    accentClass: 'from-orange-500 to-rose-600',
  },
  Quote: {
    schemaType: 'Quote',
    urlSegment: 'quote',
    label: 'Quotes',
    icon: 'quote',
    layout: QuoteLayout,
    accentClass: 'from-amber-500 to-yellow-600',
  },
  Course: {
    schemaType: 'Course',
    urlSegment: 'course',
    label: 'Courses',
    icon: 'layers',
    layout: CourseLayout,
    accentClass: 'from-emerald-500 to-teal-600',
  },
  CourseLesson: {
    schemaType: 'CourseLesson',
    urlSegment: 'course-lesson',
    label: 'Course Lessons',
    icon: 'play-circle',
    layout: CourseLessonLayout,
    accentClass: 'from-cyan-500 to-blue-600',
  },
  BlogPost: {
    schemaType: 'BlogPost',
    urlSegment: 'blog',
    label: 'Blog',
    icon: 'newspaper',
    layout: ContentLayout,
    accentClass: 'from-primary to-secondary',
  },
  Event: {
    schemaType: 'Event',
    urlSegment: 'event',
    label: 'Events',
    icon: 'trophy',
    layout: EventLayout,
    accentClass: 'from-rose-500 to-pink-600',
    layoutProps: { eventType: 'Hackathon' },
  },
  Conference: {
    schemaType: 'Conference',
    urlSegment: 'conference',
    label: 'Conferences',
    icon: 'presentation',
    layout: ConferenceLayout,
    accentClass: 'from-indigo-500 to-violet-600',
    layoutProps: { eventType: 'Conference' },
  },
  Webinar: {
    schemaType: 'Webinar',
    urlSegment: 'webinar',
    label: 'Webinars',
    icon: 'video',
    layout: WebinarLayout,
    accentClass: 'from-sky-500 to-blue-600',
    layoutProps: { eventType: 'Webinar' },
  },
  Workshop: {
    schemaType: 'Workshop',
    urlSegment: 'workshop',
    label: 'Workshops',
    icon: 'wrench',
    layout: WorkshopLayout,
    accentClass: 'from-amber-500 to-orange-600',
    layoutProps: { eventType: 'Workshop' },
  },
};

export function getTypeInfo(schemaType: string): TypeInfo | undefined {
  return typeRegistry[schemaType];
}

export function getTypeInfoByUrl(urlSegment: string): TypeInfo | undefined {
  return Object.values(typeRegistry).find((t) => t.urlSegment === urlSegment);
}

export function urlToSchemaType(urlSegment: string): string | undefined {
  return getTypeInfoByUrl(urlSegment)?.schemaType;
}

export function schemaTypeToUrl(schemaType: string): string | undefined {
  return typeRegistry[schemaType]?.urlSegment;
}

export function getTypeLabel(schemaType: string): string | undefined {
  return typeRegistry[schemaType]?.label;
}

export function getRegisteredTypes(): string[] {
  return Object.keys(typeRegistry);
}
