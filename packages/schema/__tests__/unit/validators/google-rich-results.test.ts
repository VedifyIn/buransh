import { describe, it, expect } from 'vitest';
import {
  validateArticleRichResult,
  validateFaqRichResult,
  validateHowToRichResult,
  validateReviewRichResult,
  validateEventRichResult,
  validateJobPostingRichResult,
  validateCourseRichResult,
  validateVideoRichResult,
  validateBreadcrumbRichResult,
  validateForGoogleRichResults,
  validateGraphForGoogle,
} from '../../../src/validators/google-rich-results';

// ── Article ───────────────────────────────────────────────────────────

describe('validateArticleRichResult', () => {
  it('passes a valid article', () => {
    const result = validateArticleRichResult({
      '@type': 'BlogPosting',
      headline: 'My Post Title',
      author: { '@type': 'Person', name: 'Alice' },
      datePublished: '2025-01-15',
      image: {
        '@type': 'ImageObject',
        url: 'https://cdn.example.com/img.jpg',
        width: 1200,
        height: 630,
      },
    });
    expect(result.valid).toBe(true);
  });

  it('fails when headline is missing', () => {
    const result = validateArticleRichResult({
      '@type': 'BlogPosting',
      author: { '@type': 'Person', name: 'Alice' },
      datePublished: '2025-01-15',
      image: 'https://cdn.example.com/img.jpg',
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.field === 'headline')).toBe(true);
  });

  it('warns when headline exceeds 110 characters', () => {
    const result = validateArticleRichResult({
      '@type': 'BlogPosting',
      headline: 'A'.repeat(120),
      author: {},
      datePublished: '2025-01-15',
      image: {
        '@type': 'ImageObject',
        url: 'https://cdn.example.com/img.jpg',
        width: 1200,
        height: 630,
      },
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.field === 'headline')).toBe(true);
  });
});

// ── FAQ ───────────────────────────────────────────────────────────────

describe('validateFaqRichResult', () => {
  const validFaq = {
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'Q1?', acceptedAnswer: { '@type': 'Answer', text: 'A1' } },
      { '@type': 'Question', name: 'Q2?', acceptedAnswer: { '@type': 'Answer', text: 'A2' } },
    ],
  };

  it('passes a valid FAQ', () => {
    expect(validateFaqRichResult(validFaq).valid).toBe(true);
  });

  it('fails with fewer than 2 questions', () => {
    const result = validateFaqRichResult({
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Q1?', acceptedAnswer: { '@type': 'Answer', text: 'A1' } },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it('fails when answer text is missing', () => {
    const result = validateFaqRichResult({
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Q1?', acceptedAnswer: { '@type': 'Answer' } },
        { '@type': 'Question', name: 'Q2?', acceptedAnswer: { '@type': 'Answer', text: 'A2' } },
      ],
    });
    expect(result.valid).toBe(false);
  });
});

// ── HowTo ─────────────────────────────────────────────────────────────

describe('validateHowToRichResult', () => {
  it('passes a valid HowTo', () => {
    const result = validateHowToRichResult({
      '@type': 'HowTo',
      name: 'How to make tea',
      step: [
        { '@type': 'HowToStep', text: 'Boil water' },
        { '@type': 'HowToStep', text: 'Add tea bag' },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('fails when steps are missing', () => {
    const result = validateHowToRichResult({ '@type': 'HowTo', name: 'How to do X', step: [] });
    expect(result.valid).toBe(false);
  });
});

// ── Review ────────────────────────────────────────────────────────────

describe('validateReviewRichResult', () => {
  it('passes a valid review', () => {
    const result = validateReviewRichResult({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: 4 },
      itemReviewed: { '@type': 'Book', name: 'The Book' },
      author: { '@type': 'Person', name: 'Reviewer' },
    });
    expect(result.valid).toBe(true);
  });

  it('fails when itemReviewed is missing', () => {
    const result = validateReviewRichResult({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: 4 },
      author: { '@type': 'Person', name: 'Reviewer' },
    });
    expect(result.valid).toBe(false);
  });
});

// ── Event ─────────────────────────────────────────────────────────────

describe('validateEventRichResult', () => {
  it('passes a valid in-person event', () => {
    const result = validateEventRichResult({
      '@type': 'Event',
      name: 'Hackathon 2025',
      startDate: '2025-08-01',
      location: { '@type': 'Place', name: 'Bangalore' },
    });
    expect(result.valid).toBe(true);
  });

  it('passes an online event without location', () => {
    const result = validateEventRichResult({
      '@type': 'Event',
      name: 'Webinar',
      startDate: '2025-08-01',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    });
    expect(result.valid).toBe(true);
  });

  it('fails when startDate is missing', () => {
    const result = validateEventRichResult({ '@type': 'Event', name: 'Event' });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.field === 'startDate')).toBe(true);
  });

  it('fails when endDate precedes startDate', () => {
    const result = validateEventRichResult({
      '@type': 'Event',
      name: 'Bad Event',
      startDate: '2025-08-10',
      endDate: '2025-08-01',
      location: { '@type': 'Place', name: 'Somewhere' },
    });
    expect(result.valid).toBe(false);
  });
});

// ── JobPosting ────────────────────────────────────────────────────────

describe('validateJobPostingRichResult', () => {
  it('passes a valid job posting', () => {
    const result = validateJobPostingRichResult({
      '@type': 'JobPosting',
      title: 'Software Engineer',
      description: 'Build great products.',
      datePosted: '2025-01-01',
      hiringOrganization: { '@type': 'Organization', name: 'Vedify' },
    });
    expect(result.valid).toBe(true);
  });

  it('fails when title is missing', () => {
    const result = validateJobPostingRichResult({
      '@type': 'JobPosting',
      description: 'Build great products.',
      datePosted: '2025-01-01',
      hiringOrganization: { '@type': 'Organization', name: 'Vedify' },
    });
    expect(result.valid).toBe(false);
  });
});

// ── Course ────────────────────────────────────────────────────────────

describe('validateCourseRichResult', () => {
  it('passes a valid course', () => {
    const result = validateCourseRichResult({
      '@type': 'Course',
      name: 'TypeScript Basics',
      description: 'Learn TypeScript.',
      provider: { '@type': 'Organization', name: 'Vedify' },
    });
    expect(result.valid).toBe(true);
  });

  it('fails when description is missing', () => {
    const result = validateCourseRichResult({
      '@type': 'Course',
      name: 'TypeScript Basics',
      provider: { '@type': 'Organization', name: 'Vedify' },
    });
    expect(result.valid).toBe(false);
  });
});

// ── VideoObject ───────────────────────────────────────────────────────

describe('validateVideoRichResult', () => {
  it('passes a valid video', () => {
    const result = validateVideoRichResult({
      '@type': 'VideoObject',
      name: 'Tutorial',
      description: 'Learn stuff.',
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      uploadDate: '2025-01-15',
    });
    expect(result.valid).toBe(true);
  });

  it('fails when thumbnailUrl is missing', () => {
    const result = validateVideoRichResult({
      '@type': 'VideoObject',
      name: 'Tutorial',
      description: 'Learn stuff.',
      uploadDate: '2025-01-15',
    });
    expect(result.valid).toBe(false);
  });
});

// ── BreadcrumbList ────────────────────────────────────────────────────

describe('validateBreadcrumbRichResult', () => {
  it('passes a valid breadcrumb', () => {
    const result = validateBreadcrumbRichResult({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://vedify.in' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://vedify.in/blog' },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('fails when itemListElement is empty', () => {
    const result = validateBreadcrumbRichResult({
      '@type': 'BreadcrumbList',
      itemListElement: [],
    });
    expect(result.valid).toBe(false);
  });
});

// ── Dispatch ──────────────────────────────────────────────────────────

describe('validateForGoogleRichResults', () => {
  it('dispatches to correct validator by @type', () => {
    const result = validateForGoogleRichResults({
      '@type': 'BlogPosting',
      headline: 'Title',
      author: {},
      datePublished: '2025-01-01',
      image: {
        '@type': 'ImageObject',
        url: 'https://cdn.example.com/img.jpg',
        width: 1200,
        height: 630,
      },
    });
    expect(result.valid).toBe(true);
  });

  it('returns passing result for unknown @type', () => {
    const result = validateForGoogleRichResults({ '@type': 'UnknownType' });
    expect(result.valid).toBe(true);
  });

  it('fails when @type is missing', () => {
    const result = validateForGoogleRichResults({ name: 'No type' });
    expect(result.valid).toBe(false);
  });
});

describe('validateGraphForGoogle', () => {
  it('aggregates issues across all nodes', () => {
    const graph = [
      {
        '@type': 'BlogPosting',
        headline: 'Post',
        author: {},
        datePublished: '2025-01-01',
        image: {
          '@type': 'ImageObject',
          url: 'https://cdn.example.com/img.jpg',
          width: 1200,
          height: 630,
        },
      },
      { '@type': 'FAQPage' }, // missing mainEntity
    ];
    const result = validateGraphForGoogle(graph);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.field === 'mainEntity')).toBe(true);
  });
});
