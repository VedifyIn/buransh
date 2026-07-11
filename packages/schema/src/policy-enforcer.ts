import type { ContentFrontmatter } from './index';
import { CONTENT_TYPE_FLAGS } from './mappings';
import type { ContentType } from './enums';

export type PolicyWarning = {
  field: string;
  message: string;
};

export type PolicyResult = {
  warnings: PolicyWarning[];
};

const CONTENT_LENGTH_RULES: Record<string, { min: number; max: number }> = {
  Tutorial: { min: 1500, max: 10000 },
  CodeSnippet: { min: 100, max: 1500 },
  BlogPost: { min: 800, max: 5000 },
  Essay: { min: 1000, max: 6000 },
  Gist: { min: 100, max: 500 },
  QuickNote: { min: 50, max: 500 },
  Recipe: { min: 400, max: 2000 },
  Quote: { min: 50, max: 500 },
  default: { min: 300, max: 3000 },
};

export function enforcePolicy(fm: ContentFrontmatter, body?: string): PolicyResult {
  const warnings: PolicyWarning[] = [];
  const type = fm.type as ContentType;
  const flags = CONTENT_TYPE_FLAGS[type];

  if (!fm.image) {
    warnings.push({
      field: 'image',
      message: 'Missing hero image — recommended for SEO and social sharing',
    });
  }

  if (flags?.hasAeo && !fm.aeoDirectAnswer) {
    warnings.push({
      field: 'aeoDirectAnswer',
      message: `Missing aeoDirectAnswer — recommended for ${fm.type} to improve AI assistant visibility`,
    });
  }

  if (body && body.length > 0) {
    const wordCount = body.trim() === '' ? 0 : body.trim().split(/\s+/).length;
    const rule = CONTENT_LENGTH_RULES[fm.type] || CONTENT_LENGTH_RULES.default;

    if (wordCount < rule.min) {
      warnings.push({
        field: 'body',
        message: `Content length (${wordCount} words) below recommended minimum (${rule.min}) for ${fm.type}`,
      });
    }

    if (wordCount > rule.max) {
      warnings.push({
        field: 'body',
        message: `Content length (${wordCount} words) exceeds recommended maximum (${rule.max}) for ${fm.type}`,
      });
    }

    const internalLinkMatches = body.match(/\]\(\/[^)]+\)/g);
    if (!internalLinkMatches || internalLinkMatches.length === 0) {
      warnings.push({
        field: 'body',
        message: 'No internal links found — consider linking to related content',
      });
    }

    if (flags?.hasFaq && (!fm.faqs || fm.faqs.length === 0)) {
      warnings.push({
        field: 'faqs',
        message: `Missing FAQ section — recommended for ${fm.type} to enhance AEO`,
      });
    }
  }

  return { warnings };
}
