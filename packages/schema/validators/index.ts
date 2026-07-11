/**
 * Re-exports from the canonical validators location (src/validators/).
 * All validators live in src/validators/ — this file is the public package export.
 */
export {
  checkRequiredFields,
  checkUrl,
  checkDate,
  runChecks,
  pass,
  fail,
  assertValid,
} from '../src/validators/base-validator';
export type { ValidationResult, SchemaNode } from '../src/validators/base-validator';

export {
  validateArticleRichResult,
  validateFaqRichResult,
  validateHowToRichResult,
  validateReviewRichResult,
  validateEventRichResult,
  validateJobPostingRichResult,
  validateCourseRichResult,
  validateVideoRichResult,
  validateSoftwareAppRichResult,
  validateBreadcrumbRichResult,
  validateForGoogleRichResults,
  validateGraphForGoogle,
} from '../src/validators/google-rich-results';

export { validateEventSchema } from '../src/validators/event-validator';
export { validateJobSchema } from '../src/validators/job-validator';
export { validatePersonSchema } from '../src/validators/person-validator';
export { validateOrganizationSchema } from '../src/validators/organization-validator';
export {
  validateCreativeWorkSchema,
  validateSoftwareSourceCodeSchema,
} from '../src/validators/creative-work-validator';
export { validateGraph } from '../src/validators/graph-validator';
export type { GraphValidationResult } from '../src/validators/graph-validator';
