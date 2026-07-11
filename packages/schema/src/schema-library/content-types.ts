import type { BaseFrontmatter } from '../base';
import type { OrganizationConfig, ResolvedAuthor } from './building-blocks';
import type { BookMetadata } from '../nested';
import type { TutorialCodeFrontmatter } from '../variants/tutorial-code';
import type { RecipeFrontmatter } from '../variants/recipe';
import type { BookFrontmatter } from '../variants/book';
import type { PodcastFrontmatter } from '../variants/podcast';
import type { ResearchFrontmatter } from '../variants/research';
import type { QuoteFrontmatter } from '../variants/quote';
import type { LyricsFrontmatter } from '../variants/lyrics';
import {
  getAuthorInline,
  getContentId,
  getImageSchema,
  getPublisherInline,
  getWebPageId,
  getWebsiteId,
} from './building-blocks';
import { getNutritionSchema, getRatingSchema } from './measurements';
import { DEFAULT_VALUES } from '../constants/default-values';

function buildBookItem(book: BookMetadata, image?: ReturnType<typeof getImageSchema>) {
  return {
    '@type': 'Book' as const,
    name: book.title,
    author: { '@type': 'Person' as const, name: book.author },
    isbn: book.isbn,
    publisher: book.publisher,
    numberOfPages: book.pages,
    genre: book.genre,
    datePublished: book.publicationDate,
    image,
  };
}

function commonArticleFields(
  baseUrl: string,
  fm: BaseFrontmatter,
  author: ResolvedAuthor,
  org?: OrganizationConfig,
) {
  return {
    '@id': getContentId(baseUrl, fm),
    url: `${baseUrl}/${fm.id}`,
    headline: fm.title,
    description: fm.description,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: DEFAULT_VALUES.language,
    author: getAuthorInline(baseUrl, author),
    publisher: getPublisherInline(baseUrl, org),
    image: getImageSchema(fm),
    mainEntityOfPage: { '@id': getWebPageId(baseUrl, fm) },
    keywords: fm.tags.join(', '),
    articleSection: fm.categories[0],
    isPartOf: { '@id': getWebsiteId(baseUrl, org?.name) },
  };
}

export function getBlogPostingSchema(
  baseUrl: string,
  fm: BaseFrontmatter,
  author: ResolvedAuthor,
  org?: OrganizationConfig,
) {
  return {
    '@type': 'BlogPosting' as const,
    ...commonArticleFields(baseUrl, fm, author, org),
  };
}

export function getArticleSchema(
  baseUrl: string,
  fm: BaseFrontmatter,
  author: ResolvedAuthor,
  org?: OrganizationConfig,
) {
  return {
    '@type': 'Article' as const,
    ...commonArticleFields(baseUrl, fm, author, org),
  };
}

export function getOpinionNewsArticleSchema(
  baseUrl: string,
  fm: BaseFrontmatter,
  author: ResolvedAuthor,
  org?: OrganizationConfig,
) {
  return {
    '@type': 'OpinionNewsArticle' as const,
    ...commonArticleFields(baseUrl, fm, author, org),
  };
}

export function getTechArticleSchema(
  baseUrl: string,
  fm: TutorialCodeFrontmatter,
  author: ResolvedAuthor,
  org?: OrganizationConfig,
) {
  return {
    '@type': 'TechArticle' as const,
    '@id': getContentId(baseUrl, fm),
    url: `${baseUrl}/${fm.id}`,
    headline: fm.title,
    description: fm.description,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: DEFAULT_VALUES.language,
    author: getAuthorInline(baseUrl, author),
    publisher: getPublisherInline(baseUrl, org),
    image: getImageSchema(fm),
    mainEntityOfPage: { '@id': getWebPageId(baseUrl, fm) },
    keywords: fm.tags.join(', '),
    articleSection: fm.categories[0],
    proficiencyLevel: fm.difficulty,
    about: fm.programmingLanguage
      ? {
          '@type': 'SoftwareApplication' as const,
          name: fm.title,
          programmingLanguage: fm.programmingLanguage[0],
        }
      : undefined,
    codeRepository: fm.codeRepository,
    dependencies: fm.dependencies,
    hasPart: fm.codeSnippet
      ? {
          '@type': 'SoftwareSourceCode' as const,
          code: fm.codeSnippet,
          programmingLanguage: fm.programmingLanguage?.[0],
        }
      : undefined,
  };
}

export function getSoftwareSourceCodeSchema(
  baseUrl: string,
  fm: TutorialCodeFrontmatter,
  author: ResolvedAuthor,
) {
  return {
    '@type': 'SoftwareSourceCode' as const,
    '@id': getContentId(baseUrl, fm),
    url: `${baseUrl}/${fm.id}`,
    name: fm.title,
    description: fm.description,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: DEFAULT_VALUES.language,
    author: getAuthorInline(baseUrl, author),
    image: getImageSchema(fm),
    codeRepository: fm.codeRepository,
    programmingLanguage: fm.programmingLanguage?.[0],
    dependencies: fm.dependencies,
    codeSampleType: fm.codeSnippet,
  };
}

export function getRecipeSchema(baseUrl: string, fm: RecipeFrontmatter, author: ResolvedAuthor) {
  return {
    '@type': 'Recipe' as const,
    '@id': getContentId(baseUrl, fm),
    url: `${baseUrl}/${fm.id}`,
    name: fm.title,
    description: fm.description,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: DEFAULT_VALUES.language,
    author: getAuthorInline(baseUrl, author),
    image: getImageSchema(fm),
    mainEntityOfPage: { '@id': getWebPageId(baseUrl, fm) },
    prepTime: fm.prepTime,
    cookTime: fm.cookTime,
    totalTime: fm.totalTime,
    recipeYield: fm.yields,
    recipeCategory: fm.recipeCategory,
    recipeCuisine: fm.recipeCuisine,
    cookingMethod: fm.cookingMethod,
    recipeIngredient: fm.ingredients?.map(
      (ing) => `${ing.amount} ${ing.name}${ing.preparation ? `, ${ing.preparation}` : ''}`,
    ),
    recipeInstructions: fm.instructions?.map((step, i) => ({
      '@type': 'HowToStep' as const,
      position: i + 1,
      text: step.text,
      image: step.image,
    })),
    nutrition: getNutritionSchema(fm),
    suitableForDiet: fm.suitableForDiet?.map((d) => ({ '@type': d as string })),
  };
}

export function getBookSchema(_baseUrl: string, fm: BookFrontmatter, _author: ResolvedAuthor) {
  if (!fm.book) return undefined;
  return {
    '@id': getContentId(_baseUrl, fm),
    url: `${_baseUrl}/${fm.id}`,
    ...buildBookItem(fm.book, getImageSchema(fm)),
  };
}

export function getReviewSchema(baseUrl: string, fm: BookFrontmatter, author: ResolvedAuthor) {
  if (!fm.book) return undefined;
  return {
    '@type': 'Review' as const,
    '@id': getContentId(baseUrl, fm),
    url: `${baseUrl}/${fm.id}`,
    name: `Review of ${fm.book.title}`,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: DEFAULT_VALUES.language,
    itemReviewed: buildBookItem(fm.book),
    reviewRating: getRatingSchema(fm),
    reviewBody: fm.reviewBody,
    author: getAuthorInline(baseUrl, author),
  };
}

export function getCourseSchema(
  baseUrl: string,
  fm: BaseFrontmatter,
  author: ResolvedAuthor,
  _isLesson = false,
) {
  const extra = fm as BaseFrontmatter & {
    educationalLevel?: string;
    timeRequired?: string;
    numberOfLessons?: number;
    provider?: { name: string; url?: string };
    courseCode?: string;
  };
  return {
    '@type': 'Course' as const,
    '@id': getContentId(baseUrl, fm),
    url: `${baseUrl}/${fm.id}`,
    name: fm.title,
    description: fm.description,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: DEFAULT_VALUES.language,
    author: getAuthorInline(baseUrl, author),
    image: getImageSchema(fm),
    mainEntityOfPage: { '@id': getWebPageId(baseUrl, fm) },
    provider: extra.provider
      ? {
          '@type': 'Organization' as const,
          name: extra.provider.name,
          url: extra.provider.url,
        }
      : undefined,
    educationalLevel: extra.educationalLevel,
    timeRequired: extra.timeRequired,
    numberOfLessons: extra.numberOfLessons,
    courseCode: extra.courseCode,
    hasCourseInstance: {
      '@type': 'CourseInstance' as const,
      courseMode: 'Online',
      url: `${baseUrl}/${fm.id}`,
    },
  };
}

export function getPodcastEpisodeSchema(
  baseUrl: string,
  fm: PodcastFrontmatter,
  author: ResolvedAuthor,
) {
  return {
    '@type': 'PodcastEpisode' as const,
    '@id': getContentId(baseUrl, fm),
    name: fm.title,
    url: `${baseUrl}/${fm.id}`,
    description: fm.description,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: DEFAULT_VALUES.language,
    author: getAuthorInline(baseUrl, author),
    image: getImageSchema(fm),
    audio: fm.media
      ? {
          '@type': 'AudioObject' as const,
          contentUrl: fm.media.url,
          duration: fm.media.duration,
          transcript: fm.media.transcript,
        }
      : undefined,
    episodeNumber: fm.episodeNumber,
    seasonNumber: fm.seasonNumber,
    partOfSeries: fm.podcastSeries
      ? {
          '@type': 'PodcastSeries' as const,
          name: fm.podcastSeries,
        }
      : undefined,
  };
}

export function getScholarlyArticleSchema(
  baseUrl: string,
  fm: ResearchFrontmatter,
  author: ResolvedAuthor,
  org?: OrganizationConfig,
) {
  return {
    '@type': 'ScholarlyArticle' as const,
    '@id': getContentId(baseUrl, fm),
    url: `${baseUrl}/${fm.id}`,
    name: fm.title,
    headline: fm.title,
    description: fm.description,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: DEFAULT_VALUES.language,
    author: getAuthorInline(baseUrl, author),
    publisher: getPublisherInline(baseUrl, org),
    image: getImageSchema(fm),
    mainEntityOfPage: { '@id': getWebPageId(baseUrl, fm) },
    citation: fm.citation,
    journal: fm.journal,
    doi: fm.doi,
    sameAs: fm.arxivId ? `https://arxiv.org/abs/${fm.arxivId}` : undefined,
  };
}

export function getPatentSchema(baseUrl: string, fm: ResearchFrontmatter, author: ResolvedAuthor) {
  return {
    '@type': 'Patent' as const,
    '@id': getContentId(baseUrl, fm),
    url: `${baseUrl}/${fm.id}`,
    name: fm.title,
    description: fm.description,
    datePublished: fm.issueDate || fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: DEFAULT_VALUES.language,
    author: getAuthorInline(baseUrl, author),
    image: getImageSchema(fm),
    mainEntityOfPage: { '@id': getWebPageId(baseUrl, fm) },
    identifier: fm.patentNumber,
    applicant: fm.applicant ? { '@type': 'Organization' as const, name: fm.applicant } : undefined,
  };
}

export function getQuoteSchema(_baseUrl: string, fm: QuoteFrontmatter, _author: ResolvedAuthor) {
  if (!fm.quote) return undefined;
  return {
    '@type': 'Quote' as const,
    '@id': getContentId(_baseUrl, fm),
    url: `${_baseUrl}/${fm.id}`,
    text: fm.quote.text,
    datePublished: fm.datePublished,
    inLanguage: DEFAULT_VALUES.language,
    author: {
      '@type': 'Person' as const,
      name: fm.quote.attributedTo.name,
      url: fm.quote.attributedTo.url,
      sameAs: fm.quote.attributedTo.sameAs,
    },
    about: fm.quote.context,
  };
}

export function getProfilePageSchema(baseUrl: string, fm: BaseFrontmatter, author: ResolvedAuthor) {
  return {
    '@type': 'ProfilePage' as const,
    '@id': getContentId(baseUrl, fm),
    url: `${baseUrl}/${fm.id}`,
    name: fm.title,
    description: fm.description,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: DEFAULT_VALUES.language,
    author: getAuthorInline(baseUrl, author),
    image: getImageSchema(fm),
    mainEntityOfPage: { '@id': getWebPageId(baseUrl, fm) },
  };
}

export function getCollectionPageSchema(
  baseUrl: string,
  fm: BaseFrontmatter,
  author: ResolvedAuthor,
  org?: OrganizationConfig,
) {
  return {
    '@type': 'CollectionPage' as const,
    '@id': getContentId(baseUrl, fm),
    url: `${baseUrl}/${fm.id}`,
    name: fm.title,
    description: fm.description,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: DEFAULT_VALUES.language,
    author: getAuthorInline(baseUrl, author),
    image: getImageSchema(fm),
    mainEntityOfPage: { '@id': getWebPageId(baseUrl, fm) },
    isPartOf: { '@id': getWebsiteId(baseUrl, org?.name) },
  };
}

export function getLyricsSchema(baseUrl: string, fm: LyricsFrontmatter, author: ResolvedAuthor) {
  return {
    '@type': 'MusicComposition' as const,
    '@id': getContentId(baseUrl, fm),
    url: `${baseUrl}/${fm.id}`,
    name: fm.title,
    description: fm.description,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: fm.inLanguage ?? DEFAULT_VALUES.language,
    author: getAuthorInline(baseUrl, author),
    image: getImageSchema(fm),
    composer: fm.composer ? { '@type': 'Person' as const, name: fm.composer } : undefined,
    lyricist: fm.lyricist ? { '@type': 'Person' as const, name: fm.lyricist } : undefined,
    genre: fm.genre?.length > 0 ? fm.genre : undefined,
    iswcCode: fm.iswc,
    recordedAs: fm.media
      ? {
          '@type': 'AudioObject' as const,
          contentUrl: fm.media.url,
          duration: fm.media.duration,
        }
      : undefined,
    publisher: fm.publisher ? { '@type': 'Organization' as const, name: fm.publisher } : undefined,
  };
}
