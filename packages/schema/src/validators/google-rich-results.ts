/**
 * Google Rich Results validator.
 *
 * Checks the minimum requirements for each Rich Result type based on
 * https://developers.google.com/search/docs/appearance/structured-data
 */

import { runChecks, checkRequiredFields, checkUrl, checkDate } from './base-validator';
import type { ValidationResult, SchemaNode } from './base-validator';
import type { ValidationIssue } from '../errors/validation-error';

// ── Article / BlogPosting / TechArticle ──────────────────────────────

export function validateArticleRichResult(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['headline', 'author', 'datePublished', 'image']),
    () => {
      const issues: ValidationIssue[] = [];
      const headline = schema['headline'];
      if (typeof headline === 'string' && headline.length > 110) {
        issues.push({
          field: 'headline',
          message: 'Headline should be 110 characters or fewer for rich results',
          value: headline,
        });
      }
      return issues;
    },
    () => checkDate(schema, 'datePublished'),
    () => checkDate(schema, 'dateModified'),
    () => {
      const image = schema['image'];
      if (!image) return [];
      const imgObj =
        typeof image === 'object' && !Array.isArray(image) ? (image as SchemaNode) : null;
      const issues: ValidationIssue[] = [];
      if (imgObj) {
        if (!imgObj['url']) {
          issues.push({ field: 'image.url', message: 'image.url is required', value: imgObj });
        }
        if (!imgObj['width'] || !imgObj['height']) {
          issues.push({
            field: 'image.dimensions',
            message: 'image.width and image.height are recommended for rich results',
            value: imgObj,
          });
        }
      }
      return issues;
    },
  ]);
}

// ── FAQPage ───────────────────────────────────────────────────────────

export function validateFaqRichResult(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['mainEntity']),
    () => {
      const issues: ValidationIssue[] = [];
      const mainEntity = schema['mainEntity'];
      if (!Array.isArray(mainEntity) || mainEntity.length < 2) {
        issues.push({
          field: 'mainEntity',
          message: 'FAQPage requires at least 2 Question/Answer pairs',
          value: mainEntity,
        });
        return issues;
      }
      for (let i = 0; i < mainEntity.length; i++) {
        const q = mainEntity[i] as SchemaNode;
        if (!q['name']) {
          issues.push({
            field: `mainEntity[${i}].name`,
            message: 'Question name is required',
            value: q,
          });
        }
        const answer = q['acceptedAnswer'] as SchemaNode | undefined;
        if (!answer?.['text']) {
          issues.push({
            field: `mainEntity[${i}].acceptedAnswer.text`,
            message: 'Answer text is required',
            value: answer,
          });
        }
      }
      return issues;
    },
  ]);
}

// ── HowTo ─────────────────────────────────────────────────────────────

export function validateHowToRichResult(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['name', 'step']),
    () => {
      const issues: ValidationIssue[] = [];
      const steps = schema['step'];
      if (!Array.isArray(steps) || steps.length === 0) {
        issues.push({
          field: 'step',
          message: 'HowTo requires at least one step with text',
          value: steps,
        });
        return issues;
      }
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i] as SchemaNode;
        if (!step['text'] && !step['name']) {
          issues.push({
            field: `step[${i}]`,
            message: 'Each HowToStep must have a text or name',
            value: step,
          });
        }
      }
      return issues;
    },
  ]);
}

// ── Review Snippet ────────────────────────────────────────────────────

export function validateReviewRichResult(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['reviewRating', 'itemReviewed', 'author']),
    () => {
      const issues: ValidationIssue[] = [];
      const rating = schema['reviewRating'] as SchemaNode | undefined;
      if (rating && !rating['ratingValue']) {
        issues.push({
          field: 'reviewRating.ratingValue',
          message: 'reviewRating.ratingValue is required',
          value: rating,
        });
      }
      return issues;
    },
  ]);
}

// ── Event ─────────────────────────────────────────────────────────────

export function validateEventRichResult(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['name', 'startDate']),
    () => checkDate(schema, 'startDate'),
    () => checkDate(schema, 'endDate'),
    () => {
      const issues: ValidationIssue[] = [];
      const start = schema['startDate'];
      const end = schema['endDate'];
      if (start && end && typeof start === 'string' && typeof end === 'string') {
        const startD = new Date(start);
        const endD = new Date(end);
        if (!isNaN(startD.getTime()) && !isNaN(endD.getTime()) && endD < startD) {
          issues.push({ field: 'endDate', message: 'endDate must be after startDate', value: end });
        }
      }
      const location = schema['location'];
      const attendanceMode = schema['eventAttendanceMode'];
      const isOnline =
        typeof attendanceMode === 'string' && attendanceMode.includes('OnlineEventAttendanceMode');

      if (!location && !isOnline) {
        issues.push({
          field: 'location',
          message: 'Event location is required for in-person or mixed events',
          value: location,
        });
      }
      return issues;
    },
  ]);
}

// ── JobPosting ────────────────────────────────────────────────────────

export function validateJobPostingRichResult(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['title', 'description', 'datePosted', 'hiringOrganization']),
    () => checkDate(schema, 'datePosted'),
    () => checkDate(schema, 'validThrough'),
    () => {
      const issues: ValidationIssue[] = [];
      const org = schema['hiringOrganization'] as SchemaNode | undefined;
      if (org && !org['name']) {
        issues.push({
          field: 'hiringOrganization.name',
          message: 'hiringOrganization.name is required',
          value: org,
        });
      }
      return issues;
    },
  ]);
}

// ── Course ────────────────────────────────────────────────────────────

export function validateCourseRichResult(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['name', 'description', 'provider']),
    () => {
      const issues: ValidationIssue[] = [];
      const provider = schema['provider'] as SchemaNode | undefined;
      if (provider && !provider['name']) {
        issues.push({
          field: 'provider.name',
          message: 'provider.name is required',
          value: provider,
        });
      }
      return issues;
    },
  ]);
}

// ── VideoObject ───────────────────────────────────────────────────────

export function validateVideoRichResult(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['name', 'description', 'thumbnailUrl', 'uploadDate']),
    () => checkDate(schema, 'uploadDate'),
    () => checkUrl(schema, 'thumbnailUrl'),
    () => checkUrl(schema, 'contentUrl'),
    () => checkUrl(schema, 'embedUrl'),
  ]);
}

// ── Software Application ──────────────────────────────────────────────

export function validateSoftwareAppRichResult(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['name', 'operatingSystem', 'applicationCategory']),
  ]);
}

// ── BreadcrumbList ────────────────────────────────────────────────────

export function validateBreadcrumbRichResult(schema: SchemaNode): ValidationResult {
  return runChecks([
    () => checkRequiredFields(schema, ['itemListElement']),
    () => {
      const issues: ValidationIssue[] = [];
      const items = schema['itemListElement'];
      if (!Array.isArray(items) || items.length === 0) {
        issues.push({
          field: 'itemListElement',
          message: 'BreadcrumbList requires at least one ListItem',
          value: items,
        });
        return issues;
      }
      for (let i = 0; i < items.length; i++) {
        const item = items[i] as SchemaNode;
        if (!item['position']) {
          issues.push({
            field: `itemListElement[${i}].position`,
            message: 'position is required',
            value: item,
          });
        }
        if (!item['name'] && !item['item']) {
          issues.push({
            field: `itemListElement[${i}]`,
            message: 'name or item is required',
            value: item,
          });
        }
      }
      return issues;
    },
  ]);
}

// ── Dispatch ──────────────────────────────────────────────────────────

const VALIDATORS: Record<string, (schema: SchemaNode) => ValidationResult> = {
  Article: validateArticleRichResult,
  BlogPosting: validateArticleRichResult,
  TechArticle: validateArticleRichResult,
  NewsArticle: validateArticleRichResult,
  FAQPage: validateFaqRichResult,
  HowTo: validateHowToRichResult,
  Review: validateReviewRichResult,
  Event: validateEventRichResult,
  Hackathon: validateEventRichResult,
  JobPosting: validateJobPostingRichResult,
  Course: validateCourseRichResult,
  VideoObject: validateVideoRichResult,
  SoftwareApplication: validateSoftwareAppRichResult,
  BreadcrumbList: validateBreadcrumbRichResult,
};

/**
 * Validate a schema node against Google Rich Results requirements.
 * If the @type has no dedicated validator, returns a passing result.
 */
export function validateForGoogleRichResults(schema: SchemaNode): ValidationResult {
  const type = schema['@type'];
  if (typeof type !== 'string') {
    return {
      valid: false,
      issues: [{ field: '@type', message: '@type is required', value: type }],
    };
  }
  const validator = VALIDATORS[type];
  if (!validator) {
    return { valid: true, issues: [] };
  }
  return validator(schema);
}

/**
 * Validate every node in a @graph against Google Rich Results requirements.
 * Returns an aggregated result.
 */
export function validateGraphForGoogle(graph: SchemaNode[]): ValidationResult {
  const issues: ValidationIssue[] = [];
  for (const node of graph) {
    const result = validateForGoogleRichResults(node);
    issues.push(...result.issues);
  }
  return { valid: issues.length === 0, issues };
}
