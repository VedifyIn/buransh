import type { ContentFrontmatter } from '../index';
import type { ResolvedAuthor, OrganizationConfig } from './building-blocks';
import {
  getBreadcrumbSchema,
  getFAQSchema,
  getVideoSchema,
  getAuthorSchema,
  getWebPageSchema,
  getWebsiteSchema,
  getOrganizationSchema,
} from './building-blocks';
import {
  getBlogPostingSchema,
  getArticleSchema,
  getOpinionNewsArticleSchema,
  getTechArticleSchema,
  getSoftwareSourceCodeSchema,
  getRecipeSchema,
  getBookSchema,
  getReviewSchema,
  getCourseSchema,
  getPodcastEpisodeSchema,
  getScholarlyArticleSchema,
  getPatentSchema,
  getQuoteSchema,
  getProfilePageSchema,
  getCollectionPageSchema,
  getLyricsSchema,
} from './content-types';
import { SCHEMA_PRIORITY } from '../constants/priority-map';
import { deduplicateGraph } from '../utils/deduplicator';

export type { Image, Video, Faq } from '../nested';
export type { ResolvedAuthor, OrganizationConfig } from './building-blocks';

export type GraphSchema = {
  '@context': 'https://schema.org';
  '@graph': Record<string, unknown>[];
};

type PrioritizedEntry = { priority: number; schema: Record<string, unknown> };

export class SchemaLibrary {
  private baseUrl: string;
  private fm: ContentFrontmatter;
  private author: ResolvedAuthor;
  private org: OrganizationConfig | undefined;

  constructor(
    baseUrl: string,
    frontmatter: ContentFrontmatter,
    author: ResolvedAuthor,
    orgConfig?: OrganizationConfig,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.fm = frontmatter;
    this.author = author;
    this.org = orgConfig;
  }

  /**
   * Returns all JSON-LD schemas for the page as a bare array,
   * sorted by priority and deduplicated by @id.
   * Each node has no @context — call getAllAsGraph() for the wrapped form.
   */
  getAll(): Record<string, unknown>[] {
    const entries: PrioritizedEntry[] = [];

    const push = (priority: number, schema: Record<string, unknown> | undefined) => {
      if (schema) entries.push({ priority, schema });
    };

    push(SCHEMA_PRIORITY.WEBSITE, getWebsiteSchema(this.baseUrl, this.org));
    push(SCHEMA_PRIORITY.WEBPAGE, getWebPageSchema(this.baseUrl, this.fm, this.org?.name));
    push(SCHEMA_PRIORITY.BREADCRUMB, getBreadcrumbSchema(this.baseUrl, this.fm));
    push(SCHEMA_PRIORITY.BLOG_POSTING, this.getContentSchema());
    push(SCHEMA_PRIORITY.FAQ_SECTION, getFAQSchema(this.baseUrl, this.fm));
    push(SCHEMA_PRIORITY.AUTHOR, getAuthorSchema(this.baseUrl, this.author));
    push(SCHEMA_PRIORITY.ORGANIZATION, getOrganizationSchema(this.baseUrl, this.org));
    push(SCHEMA_PRIORITY.VIDEO, getVideoSchema(this.baseUrl, this.fm));

    const sorted = entries.sort((a, b) => a.priority - b.priority).map((e) => e.schema);

    return deduplicateGraph(sorted);
  }

  /**
   * Returns all schemas wrapped in a standard @context + @graph envelope.
   * This is the recommended output for JSON-LD on a page.
   */
  getAllAsGraph(): GraphSchema {
    return {
      '@context': 'https://schema.org',
      '@graph': this.getAll(),
    };
  }

  private getContentSchema(): Record<string, unknown> | undefined {
    const { baseUrl, fm, author, org } = this;

    switch (fm.type) {
      case 'BlogPost':
      case 'Essay':
        return getBlogPostingSchema(baseUrl, fm, author, org);
      case 'Opinion':
        return getOpinionNewsArticleSchema(baseUrl, fm, author, org);
      case 'Devotional':
      case 'ShortStory':
      case 'Folktale':
      case 'Gist':
      case 'QuickNote':
        return getArticleSchema(baseUrl, fm, author, org);
      case 'SeriesOverview':
        return getCollectionPageSchema(baseUrl, fm, author, org);
      case 'AboutMe':
        return getProfilePageSchema(baseUrl, fm, author);
      case 'LegalPage':
        return undefined;
      case 'Tutorial':
        return getTechArticleSchema(baseUrl, fm, author, org);
      case 'CodeSnippet':
        return getSoftwareSourceCodeSchema(baseUrl, fm, author);
      case 'Recipe':
        return getRecipeSchema(baseUrl, fm, author);
      case 'Book':
        return getBookSchema(baseUrl, fm, author);
      case 'BookReview':
        return getReviewSchema(baseUrl, fm, author);
      case 'Course':
        return getCourseSchema(baseUrl, fm, author);
      case 'CourseLesson':
        return getCourseSchema(baseUrl, fm, author, true);
      case 'PodcastEpisode':
        return getPodcastEpisodeSchema(baseUrl, fm, author);
      case 'ResearchPaper':
        return getScholarlyArticleSchema(baseUrl, fm, author, org);
      case 'Patent':
        return getPatentSchema(baseUrl, fm, author);
      case 'Quote':
        return getQuoteSchema(baseUrl, fm, author);
      case 'Lyrics':
        return getLyricsSchema(baseUrl, fm, author);
      default: {
        const _exhaustive: never = fm;
        return getBlogPostingSchema(baseUrl, _exhaustive, author, org);
      }
    }
  }
}
