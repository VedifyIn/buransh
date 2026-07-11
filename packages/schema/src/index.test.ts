import { describe, it, expect } from 'vitest';

// ── Imports ──────────────────────────────────────────────────────────
import {
  contentTypeSchema,
  difficultySchema,
  twitterCardSchema,
  dietSchema,
  seoPrioritySchema,
  statusSchema,
  intentSchema,
  topicSchema,
  contentSchema,
  validateFrontmatter,
  hasVideo,
  hasAeoDirectAnswer,
  isRecipe,
  SchemaLibrary,
  enforcePolicy,
  type ResolvedAuthor,
} from './index';

import { baseSchema } from './base';
import {
  imageSchema,
  videoSchema,
  faqSchema,
  ingredientSchema,
  instructionSchema,
  nutritionSchema,
  bookMetadataSchema,
  ratingSchema,
  mediaObjectSchema,
  quoteObjectSchema,
  providerSchema,
} from './nested';

import { simpleContentSchema } from './variants/simple';
import { tutorialCodeSchema } from './variants/tutorial-code';
import { recipeSchema } from './variants/recipe';
import { bookSchema } from './variants/book';
import { researchSchema } from './variants/research';
import { podcastSchema } from './variants/podcast';
import { quoteSchema } from './variants/quote';
import { courseSchema } from './variants/course';

import {
  getAuthorSchema,
  getImageSchema,
  getVideoSchema,
  getFAQSchema,
  getBreadcrumbSchema,
  getWebPageSchema,
  getWebsiteSchema,
  getOrganizationSchema,
} from './schema-library/building-blocks';

import {
  getBlogPostingSchema,
  getTechArticleSchema,
  getRecipeSchema,
  getBookSchema,
  getReviewSchema,
  getCourseSchema,
  getPodcastEpisodeSchema,
  getScholarlyArticleSchema,
  getQuoteSchema,
} from './schema-library/content-types';

// ══════════════════════════════════════════════════════════════════════
// MOCKS
// ══════════════════════════════════════════════════════════════════════

const author: ResolvedAuthor = {
  name: 'Vaidic Joshi',
  url: '/about-me',
  avatar: '/images/avatar.jpg',
  sameAs: ['https://twitter.com/vaidicjoshi'],
};

const baseUrl = 'https://vedify.in';

const validBase = {
  id: 'test-post',
  title: 'Test Post Title',
  description: 'A short description for testing purposes.',
  datePublished: '2025-01-15',
  dateModified: '2025-01-20',
  author: 'vaidic',
};

// ══════════════════════════════════════════════════════════════════════
// 1. ENUMS
// ══════════════════════════════════════════════════════════════════════

describe('contentTypeSchema', () => {
  it('accepts all 22 valid content types', () => {
    const types = [
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
    ] as const;
    for (const t of types) {
      expect(contentTypeSchema.parse(t)).toBe(t);
    }
  });

  it('rejects an invalid content type', () => {
    expect(() => contentTypeSchema.parse('InvalidType')).toThrow();
  });
});

describe('difficultySchema', () => {
  it('accepts Beginner, Intermediate, Advanced', () => {
    expect(difficultySchema.parse('Beginner')).toBe('Beginner');
    expect(difficultySchema.parse('Intermediate')).toBe('Intermediate');
    expect(difficultySchema.parse('Advanced')).toBe('Advanced');
  });

  it('rejects unknown difficulty', () => {
    expect(() => difficultySchema.parse('Expert')).toThrow();
  });
});

describe('twitterCardSchema', () => {
  it('accepts summary, summary_large_image, app, player', () => {
    expect(twitterCardSchema.parse('summary')).toBe('summary');
    expect(twitterCardSchema.parse('summary_large_image')).toBe('summary_large_image');
    expect(twitterCardSchema.parse('app')).toBe('app');
    expect(twitterCardSchema.parse('player')).toBe('player');
  });

  it('rejects unknown card type', () => {
    expect(() => twitterCardSchema.parse('photo')).toThrow();
  });
});

describe('dietSchema', () => {
  it('accepts all five diet values', () => {
    const diets = [
      'DiabeticDiet',
      'GlutenFreeDiet',
      'HalalDiet',
      'VeganDiet',
      'VegetarianDiet',
    ] as const;
    for (const d of diets) {
      expect(dietSchema.parse(d)).toBe(d);
    }
  });

  it('rejects unknown diet', () => {
    expect(() => dietSchema.parse('KetoDiet')).toThrow();
  });
});

describe('seoPrioritySchema', () => {
  it('accepts low, medium, high', () => {
    expect(seoPrioritySchema.parse('low')).toBe('low');
    expect(seoPrioritySchema.parse('medium')).toBe('medium');
    expect(seoPrioritySchema.parse('high')).toBe('high');
  });

  it('rejects unknown priority', () => {
    expect(() => seoPrioritySchema.parse('urgent')).toThrow();
  });
});

describe('statusSchema', () => {
  it('accepts draft, published, archived', () => {
    expect(statusSchema.parse('draft')).toBe('draft');
    expect(statusSchema.parse('published')).toBe('published');
    expect(statusSchema.parse('archived')).toBe('archived');
  });

  it('rejects unknown status', () => {
    expect(() => statusSchema.parse('pending')).toThrow();
  });
});

describe('intentSchema', () => {
  it('accepts understand, implement, debug, reference', () => {
    expect(intentSchema.parse('understand')).toBe('understand');
    expect(intentSchema.parse('implement')).toBe('implement');
    expect(intentSchema.parse('debug')).toBe('debug');
    expect(intentSchema.parse('reference')).toBe('reference');
  });

  it('rejects unknown intent', () => {
    expect(() => intentSchema.parse('explore')).toThrow();
  });
});

describe('topicSchema', () => {
  it('accepts any string (validation moved to web app)', () => {
    expect(topicSchema.parse('dsa')).toBe('dsa');
    expect(topicSchema.parse('rust')).toBe('rust');
    expect(topicSchema.parse('')).toBe('');
  });
});

// ══════════════════════════════════════════════════════════════════════
// 2. NESTED OBJECT SCHEMAS
// ══════════════════════════════════════════════════════════════════════

describe('imageSchema', () => {
  const valid = { url: 'https://example.com/img.jpg', alt: 'An image' };

  it('accepts valid image', () => {
    expect(imageSchema.parse(valid)).toEqual(valid);
  });

  it('accepts optional width and height', () => {
    const full = { ...valid, width: 800, height: 600 };
    expect(imageSchema.parse(full)).toEqual(full);
  });

  it('rejects missing url', () => {
    expect(() => imageSchema.parse({ alt: 'text' })).toThrow();
  });

  it('rejects missing alt', () => {
    expect(() => imageSchema.parse({ url: 'https://example.com/img.jpg' })).toThrow();
  });

  it('rejects empty url', () => {
    expect(() => imageSchema.parse({ url: '', alt: 'text' })).toThrow();
  });
});

describe('videoSchema', () => {
  const valid = {
    url: 'https://example.com/video.mp4',
    thumbnail: 'https://example.com/thumb.jpg',
  };

  it('accepts valid video', () => {
    expect(videoSchema.parse(valid)).toEqual(valid);
  });

  it('accepts optional fields', () => {
    const full = {
      ...valid,
      duration: 'PT10M',
      transcript: 'Hello world',
      embedUrl: 'https://example.com/embed',
      uploadDate: '2025-01-01',
    };
    expect(videoSchema.parse(full)).toEqual(full);
  });

  it('rejects non-url url', () => {
    expect(() =>
      videoSchema.parse({ url: 'not-a-url', thumbnail: 'https://example.com/thumb.jpg' }),
    ).toThrow();
  });

  it('rejects missing thumbnail', () => {
    expect(() => videoSchema.parse({ url: 'https://example.com/video.mp4' })).toThrow();
  });
});

describe('faqSchema', () => {
  it('accepts valid FAQ', () => {
    expect(faqSchema.parse({ question: 'What?', answer: 'Yes.' })).toEqual({
      question: 'What?',
      answer: 'Yes.',
    });
  });

  it('rejects empty question', () => {
    expect(() => faqSchema.parse({ question: '', answer: 'Yes.' })).toThrow();
  });

  it('rejects missing answer', () => {
    expect(() => faqSchema.parse({ question: 'What?' })).toThrow();
  });
});

describe('ingredientSchema', () => {
  it('accepts valid ingredient', () => {
    expect(ingredientSchema.parse({ name: 'Sugar', amount: '100g' })).toEqual({
      name: 'Sugar',
      amount: '100g',
    });
  });

  it('accepts optional preparation', () => {
    expect(ingredientSchema.parse({ name: 'Onion', amount: '1', preparation: 'diced' })).toEqual({
      name: 'Onion',
      amount: '1',
      preparation: 'diced',
    });
  });

  it('rejects empty name', () => {
    expect(() => ingredientSchema.parse({ name: '', amount: '1' })).toThrow();
  });

  it('rejects missing amount', () => {
    expect(() => ingredientSchema.parse({ name: 'Salt' })).toThrow();
  });
});

describe('instructionSchema', () => {
  it('accepts valid instruction', () => {
    expect(instructionSchema.parse({ text: 'Mix well' })).toEqual({ text: 'Mix well' });
  });

  it('accepts optional image', () => {
    expect(instructionSchema.parse({ text: 'Mix well', image: 'step1.jpg' })).toEqual({
      text: 'Mix well',
      image: 'step1.jpg',
    });
  });

  it('rejects empty text', () => {
    expect(() => instructionSchema.parse({ text: '' })).toThrow();
  });
});

describe('nutritionSchema', () => {
  it('accepts empty object (all optional)', () => {
    expect(nutritionSchema.parse({})).toEqual({});
  });

  it('accepts all fields', () => {
    expect(
      nutritionSchema.parse({ calories: '200', protein: '10g', carbs: '30g', fat: '5g' }),
    ).toEqual({ calories: '200', protein: '10g', carbs: '30g', fat: '5g' });
  });
});

describe('bookMetadataSchema', () => {
  const valid = { title: 'Test Book', author: 'Test Author' };

  it('accepts valid book metadata', () => {
    expect(bookMetadataSchema.parse(valid)).toEqual(valid);
  });

  it('accepts all optional fields', () => {
    const full = {
      ...valid,
      isbn: '123-456',
      publisher: 'Pub',
      pages: 300,
      genre: ['Fiction'],
      publicationDate: '2020-01-01',
    };
    expect(bookMetadataSchema.parse(full)).toEqual(full);
  });

  it('rejects empty title', () => {
    expect(() => bookMetadataSchema.parse({ title: '', author: 'A' })).toThrow();
  });

  it('rejects missing author', () => {
    expect(() => bookMetadataSchema.parse({ title: 'Book' })).toThrow();
  });
});

describe('ratingSchema', () => {
  it('accepts valid rating', () => {
    expect(ratingSchema.parse({ value: 4 })).toEqual({ value: 4, bestRating: 5, worstRating: 1 });
  });

  it('applies defaults for bestRating and worstRating', () => {
    const r = ratingSchema.parse({ value: 3 });
    expect(r.bestRating).toBe(5);
    expect(r.worstRating).toBe(1);
  });

  it('rejects negative value', () => {
    expect(() => ratingSchema.parse({ value: -1 })).toThrow();
  });

  it('rejects value above 5', () => {
    expect(() => ratingSchema.parse({ value: 6 })).toThrow();
  });

  it('accepts value at boundary 0', () => {
    expect(ratingSchema.parse({ value: 0 }).value).toBe(0);
  });

  it('accepts value at boundary 5', () => {
    expect(ratingSchema.parse({ value: 5 }).value).toBe(5);
  });
});

describe('mediaObjectSchema', () => {
  it('accepts audio media', () => {
    expect(
      mediaObjectSchema.parse({ type: 'audio', url: 'https://example.com/audio.mp3' }),
    ).toEqual({ type: 'audio', url: 'https://example.com/audio.mp3' });
  });

  it('accepts video media', () => {
    expect(mediaObjectSchema.parse({ type: 'video', url: 'https://example.com/vid.mp4' })).toEqual({
      type: 'video',
      url: 'https://example.com/vid.mp4',
    });
  });

  it('rejects invalid type', () => {
    expect(() =>
      mediaObjectSchema.parse({ type: 'image', url: 'https://example.com/img.jpg' }),
    ).toThrow();
  });

  it('accepts optional duration and transcript', () => {
    const m = mediaObjectSchema.parse({
      type: 'audio',
      url: 'https://example.com/a.mp3',
      duration: 'PT5M',
      transcript: 'Hello',
    });
    expect(m.duration).toBe('PT5M');
    expect(m.transcript).toBe('Hello');
  });
});

describe('quoteObjectSchema', () => {
  it('accepts valid quote with attributedTo', () => {
    const q = quoteObjectSchema.parse({
      text: 'Be yourself',
      attributedTo: { name: 'Oscar Wilde' },
    });
    expect(q.text).toBe('Be yourself');
    expect(q.attributedTo.name).toBe('Oscar Wilde');
  });

  it('accepts optional context', () => {
    const q = quoteObjectSchema.parse({
      text: 'Quote',
      attributedTo: { name: 'Author' },
      context: 'In a book',
    });
    expect(q.context).toBe('In a book');
  });

  it('rejects empty text', () => {
    expect(() => quoteObjectSchema.parse({ text: '', attributedTo: { name: 'A' } })).toThrow();
  });

  it('rejects missing attributedTo name', () => {
    expect(() => quoteObjectSchema.parse({ text: 'A quote', attributedTo: {} })).toThrow();
  });
});

describe('providerSchema', () => {
  it('accepts name only', () => {
    expect(providerSchema.parse({ name: 'Coursera' })).toEqual({ name: 'Coursera' });
  });

  it('accepts name and url', () => {
    expect(providerSchema.parse({ name: 'Udemy', url: 'https://udemy.com' })).toEqual({
      name: 'Udemy',
      url: 'https://udemy.com',
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// 3. BASE SCHEMA
// ══════════════════════════════════════════════════════════════════════

describe('baseSchema', () => {
  it('accepts valid minimal input', () => {
    const result = baseSchema.parse(validBase);
    expect(result.id).toBe('test-post');
    expect(result.author).toBe('vaidic');
  });

  it('applies default values', () => {
    const result = baseSchema.parse(validBase);
    expect(result.status).toBe('draft');
    expect(result.noIndex).toBe(false);
    expect(result.seoPriority).toBe('medium');
    expect(result.evergreen).toBe(false);
    expect(result.featured).toBe(false);
    expect(result.sequentialOnly).toBe(false);
    expect(result.tags).toEqual([]);
    expect(result.categories).toEqual([]);
    expect(result.prerequisites).toEqual([]);
  });

  it('rejects missing id', () => {
    const { id, ...rest } = validBase;
    expect(() => baseSchema.parse(rest)).toThrow();
  });

  it('rejects empty title', () => {
    expect(() => baseSchema.parse({ ...validBase, title: '' })).toThrow();
  });

  it('rejects title exceeding 120 characters', () => {
    expect(() => baseSchema.parse({ ...validBase, title: 'x'.repeat(121) })).toThrow();
  });

  it('rejects description exceeding 200 characters', () => {
    expect(() => baseSchema.parse({ ...validBase, description: 'x'.repeat(201) })).toThrow();
  });

  it('rejects non-string author', () => {
    expect(() => baseSchema.parse({ ...validBase, author: 123 })).toThrow();
  });

  it('accepts status override', () => {
    const result = baseSchema.parse({ ...validBase, status: 'published' });
    expect(result.status).toBe('published');
  });

  it('rejects invalid status', () => {
    expect(() => baseSchema.parse({ ...validBase, status: 'unknown' })).toThrow();
  });

  it('accepts valid intent', () => {
    const result = baseSchema.parse({ ...validBase, intent: 'understand' });
    expect(result.intent).toBe('understand');
  });

  it('accepts flexible topic values', () => {
    const result = baseSchema.parse({ ...validBase, topic: 'rust' });
    expect(result.topic).toBe('rust');
  });

  it('accepts series fields', () => {
    const result = baseSchema.parse({
      ...validBase,
      series: 'my-series',
      seriesPart: 2,
      totalParts: 5,
      sequentialOnly: true,
      prerequisites: ['part-1'],
    });
    expect(result.series).toBe('my-series');
    expect(result.seriesPart).toBe(2);
    expect(result.totalParts).toBe(5);
    expect(result.sequentialOnly).toBe(true);
    expect(result.prerequisites).toEqual(['part-1']);
  });

  it('rejects invalid socialImage url', () => {
    expect(() => baseSchema.parse({ ...validBase, socialImage: 'not-a-url' })).toThrow();
  });

  it('accepts faqs array', () => {
    const result = baseSchema.parse({
      ...validBase,
      faqs: [{ question: 'Q1?', answer: 'A1' }],
    });
    expect(result.faqs).toHaveLength(1);
    expect(result.faqs![0].question).toBe('Q1?');
  });
});

// ══════════════════════════════════════════════════════════════════════
// 4. VARIANT SCHEMAS
// ══════════════════════════════════════════════════════════════════════

describe('simpleContentSchema', () => {
  const types = [
    'BlogPost',
    'Essay',
    'Opinion',
    'ShortStory',
    'Folktale',
    'Gist',
    'QuickNote',
    'SeriesOverview',
    'Devotional',
    'LegalPage',
    'AboutMe',
  ] as const;

  for (const t of types) {
    it(`accepts type '${t}'`, () => {
      expect(simpleContentSchema.parse({ ...validBase, type: t }).type).toBe(t);
    });
  }

  it('rejects non-simple type', () => {
    expect(() => simpleContentSchema.parse({ ...validBase, type: 'Recipe' })).toThrow();
  });
});

describe('tutorialCodeSchema', () => {
  it('accepts Tutorial type', () => {
    expect(tutorialCodeSchema.parse({ ...validBase, type: 'Tutorial' }).type).toBe('Tutorial');
  });

  it('accepts CodeSnippet type', () => {
    expect(tutorialCodeSchema.parse({ ...validBase, type: 'CodeSnippet' }).type).toBe(
      'CodeSnippet',
    );
  });

  it('accepts extra fields', () => {
    const result = tutorialCodeSchema.parse({
      ...validBase,
      type: 'Tutorial',
      programmingLanguage: ['TypeScript'],
      codeRepository: 'https://github.com/user/repo',
      dependencies: ['lodash'],
      codeSnippet: 'console.log("hi");',
    });
    expect(result.programmingLanguage).toEqual(['TypeScript']);
    expect(result.codeRepository).toBe('https://github.com/user/repo');
  });

  it('rejects invalid codeRepository url', () => {
    expect(() =>
      tutorialCodeSchema.parse({
        ...validBase,
        type: 'Tutorial',
        codeRepository: 'not-a-url',
      }),
    ).toThrow();
  });
});

describe('recipeSchema', () => {
  it('accepts Recipe type', () => {
    expect(recipeSchema.parse({ ...validBase, type: 'Recipe' }).type).toBe('Recipe');
  });

  it('rejects non-recipe type', () => {
    expect(() => recipeSchema.parse({ ...validBase, type: 'BlogPost' })).toThrow();
  });

  it('accepts ingredients and instructions', () => {
    const result = recipeSchema.parse({
      ...validBase,
      type: 'Recipe',
      ingredients: [{ name: 'Flour', amount: '200g' }],
      instructions: [{ text: 'Mix' }],
      nutrition: { calories: '100' },
    });
    expect(result.ingredients).toHaveLength(1);
    expect(result.instructions).toHaveLength(1);
    expect(result.nutrition?.calories).toBe('100');
  });

  it('accepts dietary info', () => {
    const result = recipeSchema.parse({
      ...validBase,
      type: 'Recipe',
      suitableForDiet: ['VeganDiet', 'GlutenFreeDiet'],
    });
    expect(result.suitableForDiet).toEqual(['VeganDiet', 'GlutenFreeDiet']);
  });

  it('rejects invalid diet value', () => {
    expect(() =>
      recipeSchema.parse({
        ...validBase,
        type: 'Recipe',
        suitableForDiet: ['KetoDiet'],
      }),
    ).toThrow();
  });
});

describe('bookSchema', () => {
  it('accepts Book type', () => {
    expect(bookSchema.parse({ ...validBase, type: 'Book' }).type).toBe('Book');
  });

  it('accepts BookReview type', () => {
    expect(bookSchema.parse({ ...validBase, type: 'BookReview' }).type).toBe('BookReview');
  });

  it('accepts nested book metadata and rating', () => {
    const result = bookSchema.parse({
      ...validBase,
      type: 'Book',
      book: { title: 'The Book', author: 'Author' },
      rating: { value: 4 },
    });
    expect(result.book?.title).toBe('The Book');
    expect(result.rating?.value).toBe(4);
  });
});

describe('researchSchema', () => {
  it('accepts ResearchPaper type', () => {
    expect(researchSchema.parse({ ...validBase, type: 'ResearchPaper' }).type).toBe(
      'ResearchPaper',
    );
  });

  it('accepts Patent type', () => {
    expect(researchSchema.parse({ ...validBase, type: 'Patent' }).type).toBe('Patent');
  });

  it('accepts research fields', () => {
    const result = researchSchema.parse({
      ...validBase,
      type: 'ResearchPaper',
      doi: '10.1234/test',
      arxivId: '2301.12345',
      journal: 'Nature',
    });
    expect(result.doi).toBe('10.1234/test');
    expect(result.arxivId).toBe('2301.12345');
  });
});

describe('podcastSchema', () => {
  it('accepts PodcastEpisode type', () => {
    expect(podcastSchema.parse({ ...validBase, type: 'PodcastEpisode' }).type).toBe(
      'PodcastEpisode',
    );
  });

  it('accepts media object', () => {
    const result = podcastSchema.parse({
      ...validBase,
      type: 'PodcastEpisode',
      media: { type: 'audio', url: 'https://example.com/ep.mp3' },
      episodeNumber: 5,
      seasonNumber: 1,
      podcastSeries: 'My Podcast',
    });
    expect(result.media?.type).toBe('audio');
    expect(result.episodeNumber).toBe(5);
  });
});

describe('quoteSchema', () => {
  it('accepts Quote type', () => {
    expect(quoteSchema.parse({ ...validBase, type: 'Quote' }).type).toBe('Quote');
  });

  it('accepts nested quote object', () => {
    const result = quoteSchema.parse({
      ...validBase,
      type: 'Quote',
      quote: { text: 'A wise saying', attributedTo: { name: 'Sage' } },
    });
    expect(result.quote?.text).toBe('A wise saying');
  });
});

describe('courseSchema', () => {
  it('accepts Course type', () => {
    expect(courseSchema.parse({ ...validBase, type: 'Course' }).type).toBe('Course');
  });

  it('accepts CourseLesson type', () => {
    expect(courseSchema.parse({ ...validBase, type: 'CourseLesson' }).type).toBe('CourseLesson');
  });

  it('accepts course fields', () => {
    const result = courseSchema.parse({
      ...validBase,
      type: 'Course',
      educationalLevel: 'Intermediate',
      numberOfLessons: 10,
      provider: { name: 'Vedify' },
      hasRepo: true,
      repoUrl: 'https://github.com/user/repo',
      startBranch: 'main',
      finishedBranch: 'solution',
    });
    expect(result.educationalLevel).toBe('Intermediate');
    expect(result.hasRepo).toBe(true);
    expect(result.repoUrl).toBe('https://github.com/user/repo');
    expect(result.finishedBranch).toBe('solution');
  });

  it('defaults hasRepo to false', () => {
    const result = courseSchema.parse({ ...validBase, type: 'Course' });
    expect(result.hasRepo).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 5. DISCRIMINATED UNION + SUPERREFINE
// ══════════════════════════════════════════════════════════════════════

describe('contentSchema (discriminated union)', () => {
  it('parses a BlogPost', () => {
    const result = contentSchema.parse({ ...validBase, type: 'BlogPost' });
    expect(result.type).toBe('BlogPost');
    expect(result.id).toBe('test-post');
  });

  it('parses a Recipe', () => {
    const result = contentSchema.parse({ ...validBase, type: 'Recipe' });
    expect(result.type).toBe('Recipe');
  });

  it('parses a Quote', () => {
    const result = contentSchema.parse({ ...validBase, type: 'Quote' });
    expect(result.type).toBe('Quote');
  });

  it('rejects an invalid type discriminator', () => {
    expect(() => contentSchema.parse({ ...validBase, type: 'InvalidType' })).toThrow();
  });

  it('rejects missing type', () => {
    const { type: _t, ...rest } = { ...validBase, type: 'BlogPost' as const };
    expect(() => contentSchema.parse(rest)).toThrow();
  });

  describe('superRefine: seriesPart <= totalParts', () => {
    it('passes when seriesPart < totalParts', () => {
      const result = contentSchema.parse({
        ...validBase,
        type: 'BlogPost',
        seriesPart: 2,
        totalParts: 5,
      });
      expect(result.seriesPart).toBe(2);
    });

    it('passes when seriesPart equals totalParts', () => {
      const result = contentSchema.parse({
        ...validBase,
        type: 'BlogPost',
        seriesPart: 5,
        totalParts: 5,
      });
      expect(result.seriesPart).toBe(5);
    });

    it('fails when seriesPart > totalParts', () => {
      expect(() =>
        contentSchema.parse({ ...validBase, type: 'BlogPost', seriesPart: 6, totalParts: 5 }),
      ).toThrow();
    });

    it('passes when seriesPart is undefined regardless of totalParts', () => {
      const result = contentSchema.parse({ ...validBase, type: 'BlogPost', totalParts: 5 });
      expect(result.totalParts).toBe(5);
    });

    it('passes when totalParts is undefined regardless of seriesPart', () => {
      const result = contentSchema.parse({ ...validBase, type: 'BlogPost', seriesPart: 3 });
      expect(result.seriesPart).toBe(3);
    });
  });

  describe('superRefine: series requires seriesPart', () => {
    it('fails when series is set but seriesPart is missing', () => {
      expect(() =>
        contentSchema.parse({ ...validBase, type: 'BlogPost', series: 'my-series' }),
      ).toThrow();
    });

    it('passes when both series and seriesPart are set', () => {
      const result = contentSchema.parse({
        ...validBase,
        type: 'BlogPost',
        series: 'my-series',
        seriesPart: 1,
      });
      expect(result.series).toBe('my-series');
      expect(result.seriesPart).toBe(1);
    });
  });

  describe('superRefine: tags require topic', () => {
    it('fails when tags are set but topic is missing', () => {
      expect(() => contentSchema.parse({ ...validBase, type: 'BlogPost', tags: ['AI'] })).toThrow();
    });

    it('passes when both tags and topic are set', () => {
      const result = contentSchema.parse({
        ...validBase,
        type: 'BlogPost',
        tags: ['AI'],
        topic: 'dsa',
      });
      expect(result.tags).toEqual(['AI']);
      expect(result.topic).toBe('dsa');
    });

    it('passes when tags is empty and topic is missing', () => {
      const result = contentSchema.parse({ ...validBase, type: 'BlogPost', tags: [] });
      expect(result.tags).toEqual([]);
    });
  });

  describe('superRefine: difficulty required for Course/CourseLesson', () => {
    it('fails for Course without difficulty', () => {
      expect(() => contentSchema.parse({ ...validBase, type: 'Course' })).toThrow();
    });

    it('fails for CourseLesson without difficulty', () => {
      expect(() => contentSchema.parse({ ...validBase, type: 'CourseLesson' })).toThrow();
    });

    it('passes for Course with difficulty', () => {
      const result = contentSchema.parse({
        ...validBase,
        type: 'Course',
        difficulty: 'Intermediate',
      });
      expect(result.difficulty).toBe('Intermediate');
    });

    it('passes for BlogPost without difficulty', () => {
      const result = contentSchema.parse({ ...validBase, type: 'BlogPost' });
      expect(result.type).toBe('BlogPost');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// 6. HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════

describe('validateFrontmatter', () => {
  it('returns parsed data for valid input', () => {
    const result = validateFrontmatter({ ...validBase, type: 'BlogPost' });
    expect(result.type).toBe('BlogPost');
    expect(result.title).toBe('Test Post Title');
  });

  it('throws for invalid input', () => {
    expect(() => validateFrontmatter({ ...validBase, type: 'BlogPost', title: '' })).toThrow();
  });
});

describe('hasVideo', () => {
  it('returns true when video is present', () => {
    const content = contentSchema.parse({
      ...validBase,
      type: 'BlogPost',
      video: { url: 'https://example.com/v.mp4', thumbnail: 'https://example.com/t.jpg' },
    });
    expect(hasVideo(content)).toBe(true);
  });

  it('returns false when video is absent', () => {
    const content = contentSchema.parse({ ...validBase, type: 'BlogPost' });
    expect(hasVideo(content)).toBe(false);
  });
});

describe('hasAeoDirectAnswer', () => {
  it('returns true when aeoDirectAnswer is a non-empty string', () => {
    const content = contentSchema.parse({
      ...validBase,
      type: 'BlogPost',
      aeoDirectAnswer: 'Yes.',
    });
    expect(hasAeoDirectAnswer(content)).toBe(true);
  });

  it('returns false when aeoDirectAnswer is absent', () => {
    const content = contentSchema.parse({ ...validBase, type: 'BlogPost' });
    expect(hasAeoDirectAnswer(content)).toBe(false);
  });
});

describe('isRecipe', () => {
  it('returns true for Recipe', () => {
    const content = contentSchema.parse({ ...validBase, type: 'Recipe' });
    expect(isRecipe(content)).toBe(true);
  });

  it('returns false for BlogPost', () => {
    const content = contentSchema.parse({ ...validBase, type: 'BlogPost' });
    expect(isRecipe(content)).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 7. SCHEMA LIBRARY — BUILDING BLOCKS
// ══════════════════════════════════════════════════════════════════════

describe('getAuthorSchema', () => {
  it('returns a Person JSON-LD block', () => {
    const result = getAuthorSchema(baseUrl, author);
    expect(result['@type']).toBe('Person');
    expect(result['@id']).toBe(`${baseUrl}/#author`);
    expect(result.name).toBe('Vaidic Joshi');
    expect(result.sameAs).toEqual(['https://twitter.com/vaidicjoshi']);
  });
});

describe('getImageSchema', () => {
  it('returns ImageObject when image present', () => {
    const fm = baseSchema.parse({
      ...validBase,
      image: { url: 'https://example.com/img.jpg', alt: 'Alt text' },
    });
    const result = getImageSchema(fm);
    expect(result!['@type']).toBe('ImageObject');
    expect(result!.url).toBe('https://example.com/img.jpg');
  });

  it('returns undefined when no image', () => {
    const fm = baseSchema.parse(validBase);
    expect(getImageSchema(fm)).toBeUndefined();
  });
});

describe('getVideoSchema', () => {
  it('returns VideoObject when video present', () => {
    const fm = baseSchema.parse({
      ...validBase,
      video: { url: 'https://example.com/v.mp4', thumbnail: 'https://example.com/t.jpg' },
    });
    const result = getVideoSchema(baseUrl, fm);
    expect(result!['@type']).toBe('VideoObject');
    expect(result!.thumbnailUrl).toBe('https://example.com/t.jpg');
    expect(result!['@id']).toBe(`${baseUrl}/test-post#video`);
  });

  it('returns undefined when no video', () => {
    const fm = baseSchema.parse(validBase);
    expect(getVideoSchema(baseUrl, fm)).toBeUndefined();
  });
});

describe('getFAQSchema', () => {
  it('returns FAQPage when faqs present', () => {
    const fm = baseSchema.parse({ ...validBase, faqs: [{ question: 'Q?', answer: 'A.' }] });
    const result = getFAQSchema(baseUrl, fm);
    expect(result!['@type']).toBe('FAQPage');
    expect(result!['@id']).toBe(`${baseUrl}/test-post#faq`);
    expect(result!.mainEntity).toHaveLength(1);
    expect(result!.mainEntity[0].name).toBe('Q?');
  });

  it('returns undefined when no faqs', () => {
    const fm = baseSchema.parse(validBase);
    expect(getFAQSchema(baseUrl, fm)).toBeUndefined();
  });

  it('returns undefined when empty faqs', () => {
    const fm = baseSchema.parse({ ...validBase, faqs: [] });
    expect(getFAQSchema(baseUrl, fm)).toBeUndefined();
  });
});

describe('getBreadcrumbSchema', () => {
  it('returns a BreadcrumbList with 3 items', () => {
    const fm = baseSchema.parse(validBase);
    const result = getBreadcrumbSchema(baseUrl, fm);
    expect(result['@type']).toBe('BreadcrumbList');
    expect(result['@id']).toBe(`${baseUrl}/test-post#breadcrumb`);
    expect(result.itemListElement).toHaveLength(3);
    expect(result.itemListElement[0].name).toBe('Home');
    expect(result.itemListElement[2].name).toBe('Test Post Title');
  });

  it('uses first category for second breadcrumb', () => {
    const fm = baseSchema.parse({ ...validBase, categories: ['Tech'] });
    const result = getBreadcrumbSchema(baseUrl, fm);
    expect(result.itemListElement[1].name).toBe('Tech');
  });
});

describe('getWebPageSchema', () => {
  it('returns a WebPage block', () => {
    const fm = baseSchema.parse(validBase);
    const result = getWebPageSchema(baseUrl, fm);
    expect(result['@type']).toBe('WebPage');
    expect(result['@id']).toBe(`${baseUrl}/test-post#webpage`);
    expect(result.datePublished).toBe('2025-01-15');
    expect(result.isPartOf['@type']).toBe('WebSite');
    expect(result.breadcrumb['@id']).toBe(`${baseUrl}/test-post#breadcrumb`);
  });
});

describe('getWebsiteSchema', () => {
  it('returns a WebSite block with SearchAction', () => {
    const result = getWebsiteSchema(baseUrl);
    expect(result['@type']).toBe('WebSite');
    expect(result['@id']).toBe(`${baseUrl}/#website`);
    expect(result.publisher['@id']).toBe(`${baseUrl}/#organization`);
    expect(result.potentialAction['@type']).toBe('SearchAction');
  });
});

describe('getOrganizationSchema', () => {
  it('returns Organization block', () => {
    const result = getOrganizationSchema(baseUrl);
    expect(result['@type']).toBe('Organization');
    expect(result.name).toBe('Vedify');
    expect(result.logo['@type']).toBe('ImageObject');
  });
});

// ══════════════════════════════════════════════════════════════════════
// 8. SCHEMA LIBRARY — CONTENT TYPE SCHEMAS
// ══════════════════════════════════════════════════════════════════════

describe('getBlogPostingSchema', () => {
  it('returns a BlogPosting with author and publisher inline details', () => {
    const fm = baseSchema.parse(validBase);
    const result = getBlogPostingSchema(baseUrl, fm, author);
    expect(result['@type']).toBe('BlogPosting');
    expect(result['@id']).toBe(`${baseUrl}/test-post#content`);
    expect(result.author).toEqual({
      '@id': `${baseUrl}/#author`,
      '@type': 'Person',
      name: 'Vaidic Joshi',
      url: `${baseUrl}/about-me`,
    });
    expect(result.publisher).toEqual({
      '@id': `${baseUrl}/#organization`,
      '@type': 'Organization',
      name: 'Vedify',
      url: baseUrl,
    });
    expect(result.headline).toBe('Test Post Title');
  });
});

describe('getTechArticleSchema', () => {
  it('returns a TechArticle', () => {
    const fm = tutorialCodeSchema.parse({ ...validBase, type: 'Tutorial', tags: ['TypeScript'] });
    const result = getTechArticleSchema(baseUrl, fm, author);
    expect(result['@type']).toBe('TechArticle');
    expect(result.headline).toBe('Test Post Title');
    expect((result as any).keywords).toBe('TypeScript');
  });
});

describe('getRecipeSchema', () => {
  it('returns a Recipe', () => {
    const fm = recipeSchema.parse({ ...validBase, type: 'Recipe' });
    const result = getRecipeSchema(baseUrl, fm, author);
    expect(result['@type']).toBe('Recipe');
    expect(result.name).toBe('Test Post Title');
  });

  it('includes ingredients from extra fields', () => {
    const fm = { ...validBase, ingredients: [{ name: 'Sugar', amount: '100g' }] } as any;
    const result = getRecipeSchema(baseUrl, fm, author);
    expect(result.recipeIngredient).toEqual(['100g Sugar']);
  });
});

describe('getBookSchema', () => {
  it('returns a Book when book metadata present', () => {
    const fm = { ...validBase, book: { title: 'The Book', author: 'Auth' } } as any;
    const result = getBookSchema(baseUrl, fm, author);
    expect(result!['@type']).toBe('Book');
    expect(result!.name).toBe('The Book');
  });

  it('returns undefined when no book metadata', () => {
    const fm = bookSchema.parse({ ...validBase, type: 'Book' });
    const result = getBookSchema(baseUrl, fm, author);
    expect(result).toBeUndefined();
  });
});

describe('getReviewSchema', () => {
  it('returns a Review when book metadata present', () => {
    const fm = {
      ...validBase,
      book: { title: 'The Book', author: 'Auth' },
      rating: { value: 4 },
    } as any;
    const result = getReviewSchema(baseUrl, fm, author);
    expect((result as any)['@type']).toBe('Review');
    expect((result as any).itemReviewed.name).toBe('The Book');
    expect((result as any).reviewRating.ratingValue).toBe(4);
  });

  it('returns undefined when no book metadata', () => {
    const fm = bookSchema.parse({ ...validBase, type: 'Book' });
    expect(getReviewSchema(baseUrl, fm, author)).toBeUndefined();
  });
});

describe('getCourseSchema', () => {
  it('returns a Course', () => {
    const fm = baseSchema.parse(validBase);
    const result = getCourseSchema(baseUrl, fm, author);
    expect(result['@type']).toBe('Course');
    expect(result.hasCourseInstance.courseMode).toBe('Online');
  });
});

describe('getPodcastEpisodeSchema', () => {
  it('returns a PodcastEpisode', () => {
    const fm = podcastSchema.parse({ ...validBase, type: 'PodcastEpisode' });
    const result = getPodcastEpisodeSchema(baseUrl, fm, author);
    expect(result['@type']).toBe('PodcastEpisode');
    expect(result.url).toBe(`${baseUrl}/test-post`);
  });
});

describe('getScholarlyArticleSchema', () => {
  it('returns a ScholarlyArticle', () => {
    const fm = researchSchema.parse({ ...validBase, type: 'ResearchPaper' });
    const result = getScholarlyArticleSchema(baseUrl, fm, author);
    expect(result['@type']).toBe('ScholarlyArticle');
    expect(result.name).toBe('Test Post Title');
  });

  it('includes arxiv link when arxivId present', () => {
    const fm = { ...validBase, arxivId: '2301.12345' } as any;
    const result = getScholarlyArticleSchema(baseUrl, fm, author);
    expect((result as any).sameAs).toBe('https://arxiv.org/abs/2301.12345');
  });
});

describe('getQuoteSchema', () => {
  it('returns a Quote when quote object present', () => {
    const fm = {
      ...validBase,
      quote: { text: 'A quote', attributedTo: { name: 'Person' } },
    } as any;
    const result = getQuoteSchema(baseUrl, fm, author);
    expect(result!['@type']).toBe('Quote');
    expect(result!.text).toBe('A quote');
  });

  it('returns undefined when no quote object', () => {
    const fm = quoteSchema.parse({ ...validBase, type: 'Quote' });
    expect(getQuoteSchema(baseUrl, fm, author)).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════
// 9. SCHEMA LIBRARY — INTEGRATION
// ══════════════════════════════════════════════════════════════════════

describe('SchemaLibrary', () => {
  it('returns schemas for BlogPost', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'BlogPost' });
    const lib = new SchemaLibrary(baseUrl, fm, author);
    const schemas = lib.getAll();
    expect(schemas).toBeInstanceOf(Array);
    expect(schemas.length).toBeGreaterThanOrEqual(3);
    const types = schemas.map((s) => s['@type']);
    expect(types).toContain('BlogPosting');
    expect(types).toContain('WebSite');
    expect(types).toContain('WebPage');
    expect(types).toContain('Person');
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('Organization');
  });

  it('links website, webpage, breadcrumb, and article via @id references', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'BlogPost' });
    const lib = new SchemaLibrary(baseUrl, fm, author);
    const schemas = lib.getAll();
    const website = schemas.find((s) => s['@type'] === 'WebSite') as any;
    const webpage = schemas.find((s) => s['@type'] === 'WebPage') as any;
    const article = schemas.find((s) => s['@type'] === 'BlogPosting') as any;
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList') as any;

    expect(website['@id']).toBe(`${baseUrl}/#website`);
    expect(webpage.isPartOf['@id']).toBe(website['@id']);
    expect(webpage.breadcrumb['@id']).toBe(breadcrumb['@id']);
    expect(article.mainEntityOfPage['@id']).toBe(webpage['@id']);
  });

  it('includes FAQPage when faqs present', () => {
    const fm = contentSchema.parse({
      ...validBase,
      type: 'BlogPost',
      faqs: [{ question: 'Q?', answer: 'A.' }],
    });
    const lib = new SchemaLibrary(baseUrl, fm, author);
    const types = lib.getAll().map((s) => s['@type']);
    expect(types).toContain('FAQPage');
  });

  it('includes VideoObject when video present', () => {
    const fm = contentSchema.parse({
      ...validBase,
      type: 'BlogPost',
      video: { url: 'https://example.com/v.mp4', thumbnail: 'https://example.com/t.jpg' },
    });
    const lib = new SchemaLibrary(baseUrl, fm, author);
    const types = lib.getAll().map((s) => s['@type']);
    expect(types).toContain('VideoObject');
  });

  describe('dispatches correct schema per content type', () => {
    const cases: Array<{ type: string; expected: string; extra?: Record<string, unknown> }> = [
      { type: 'BlogPost', expected: 'BlogPosting' },
      { type: 'Essay', expected: 'BlogPosting' },
      { type: 'Opinion', expected: 'OpinionNewsArticle' },
      { type: 'Devotional', expected: 'Article' },
      { type: 'ShortStory', expected: 'Article' },
      { type: 'Folktale', expected: 'Article' },
      { type: 'Tutorial', expected: 'TechArticle' },
      { type: 'CodeSnippet', expected: 'SoftwareSourceCode' },
      { type: 'Recipe', expected: 'Recipe' },
      {
        type: 'Book',
        expected: 'Book',
        extra: { book: { title: 'Test Book', author: 'Test Author' } },
      },
      {
        type: 'BookReview',
        expected: 'Review',
        extra: { book: { title: 'Test Book', author: 'Test Author' }, rating: { value: 4 } },
      },
      { type: 'Course', expected: 'Course', extra: { difficulty: 'Intermediate' } },
      { type: 'CourseLesson', expected: 'Course', extra: { difficulty: 'Intermediate' } },
      { type: 'PodcastEpisode', expected: 'PodcastEpisode' },
      { type: 'ResearchPaper', expected: 'ScholarlyArticle' },
      {
        type: 'Patent',
        expected: 'Patent',
        extra: { patentNumber: 'US12345' },
      },
      {
        type: 'Quote',
        expected: 'Quote',
        extra: { quote: { text: 'A quote', attributedTo: { name: 'Person' } } },
      },
      { type: 'SeriesOverview', expected: 'CollectionPage' },
      { type: 'Gist', expected: 'Article' },
      { type: 'QuickNote', expected: 'Article' },
      { type: 'AboutMe', expected: 'ProfilePage' },
    ];

    for (const { type, expected, extra = {} } of cases) {
      it(`maps '${type}' to '${expected}'`, () => {
        const fm = contentSchema.parse({ ...validBase, ...extra, type: type as any });
        const lib = new SchemaLibrary(baseUrl, fm, author);
        const schemas = lib.getAll();
        const types = schemas.map((s) => s['@type']);
        expect(types).toContain(expected);
      });
    }

    it('LegalPage returns no content schema (generic WebPage only)', () => {
      const fm = contentSchema.parse({ ...validBase, type: 'LegalPage' });
      const lib = new SchemaLibrary(baseUrl, fm, author);
      const schemas = lib.getAll();
      const types = schemas.map((s) => s['@type']);
      expect(types).not.toContain('BlogPosting');
      expect(types).not.toContain('Article');
      expect(types).toContain('WebPage');
    });
  });

  it('getAllAsGraph returns @context + @graph envelope', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'BlogPost' });
    const lib = new SchemaLibrary(baseUrl, fm, author);
    const graph = lib.getAllAsGraph();
    expect(graph['@context']).toBe('https://schema.org');
    expect(graph['@graph']).toBeInstanceOf(Array);
    expect(graph['@graph'].length).toBeGreaterThanOrEqual(3);
    const types = graph['@graph'].map((s: any) => s['@type']);
    expect(types).toContain('BlogPosting');
    expect(types).toContain('WebSite');
    expect(types).toContain('WebPage');
  });

  it('Book type returns undefined content schema when no book metadata', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'Book' });
    const lib = new SchemaLibrary(baseUrl, fm, author);
    const schemas = lib.getAll();
    const types = schemas.map((s) => s['@type']);
    expect(types).not.toContain('Book');
  });
});

// ══════════════════════════════════════════════════════════════════════
// 10. POLICY ENFORCER
// ══════════════════════════════════════════════════════════════════════

describe('enforcePolicy', () => {
  it('warns when image is missing', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'BlogPost', topic: 'dsa', tags: ['AI'] });
    const result = enforcePolicy(fm);
    expect(result.warnings.some((w) => w.field === 'image')).toBe(true);
  });

  it('produces no image warning when image is present', () => {
    const fm = contentSchema.parse({
      ...validBase,
      type: 'BlogPost',
      topic: 'dsa',
      tags: ['AI'],
      image: { url: 'https://example.com/img.jpg', alt: 'Alt' },
    });
    const result = enforcePolicy(fm);
    expect(result.warnings.filter((w) => w.field === 'image')).toHaveLength(0);
  });

  it('warns when aeoDirectAnswer is missing for BlogPost', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'BlogPost', topic: 'dsa', tags: ['AI'] });
    const result = enforcePolicy(fm);
    expect(result.warnings.some((w) => w.field === 'aeoDirectAnswer')).toBe(true);
  });

  it('does not warn about aeoDirectAnswer for Quote', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'Quote' });
    const result = enforcePolicy(fm);
    expect(result.warnings.filter((w) => w.field === 'aeoDirectAnswer')).toHaveLength(0);
  });

  it('warns when body is below minimum word count', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'BlogPost', topic: 'dsa', tags: ['AI'] });
    const result = enforcePolicy(fm, 'short body');
    expect(result.warnings.some((w) => w.field === 'body')).toBe(true);
  });

  it('warns when body exceeds maximum word count', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'Gist', topic: 'dsa', tags: ['AI'] });
    const result = enforcePolicy(fm, 'word '.repeat(600));
    expect(result.warnings.some((w) => w.field === 'body')).toBe(true);
  });

  it('warns when no internal links in body', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'BlogPost', topic: 'dsa', tags: ['AI'] });
    const result = enforcePolicy(fm, 'some content with no links at all');
    expect(result.warnings.some((w) => w.message.includes('internal links'))).toBe(true);
  });

  it('does not warn about internal links when links present', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'BlogPost', topic: 'dsa', tags: ['AI'] });
    const result = enforcePolicy(fm, 'see [this](/related-post) for more');
    expect(result.warnings.filter((w) => w.message.includes('internal links'))).toHaveLength(0);
  });

  it('warns about missing FAQ for BlogPost with body', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'BlogPost', topic: 'dsa', tags: ['AI'] });
    const result = enforcePolicy(fm, 'some body content here');
    expect(result.warnings.some((w) => w.field === 'faqs')).toBe(true);
  });

  it('does not warn about FAQ when faqs are present', () => {
    const fm = contentSchema.parse({
      ...validBase,
      type: 'BlogPost',
      topic: 'dsa',
      tags: ['AI'],
      faqs: [{ question: 'Q?', answer: 'A.' }],
    });
    const result = enforcePolicy(fm, 'some body content here');
    expect(result.warnings.filter((w) => w.field === 'faqs')).toHaveLength(0);
  });

  it('returns no warnings for well-formed Quote without body', () => {
    const fm = contentSchema.parse({ ...validBase, type: 'Quote' });
    const result = enforcePolicy(fm);
    expect(result.warnings.filter((w) => w.field === 'image')).toHaveLength(1);
    expect(result.warnings.filter((w) => w.field === 'aeoDirectAnswer')).toHaveLength(0);
    expect(result.warnings.filter((w) => w.field === 'faqs')).toHaveLength(0);
  });
});
