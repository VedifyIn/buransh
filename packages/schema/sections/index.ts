/**
 * Re-exports from the canonical sections location (src/sections/).
 * All section generators live in src/sections/ — this file is the public package export.
 */
export { generateFaqSection } from '../src/sections/faq-section';
export type { FaqItem, FaqSectionOptions } from '../src/sections/faq-section';

export { generateCodeSection } from '../src/sections/code-section';
export type { CodeSectionData, CodeSectionOptions } from '../src/sections/code-section';

export { generateReviewSection } from '../src/sections/review-section';
export type { ReviewSectionData, ReviewSectionOptions } from '../src/sections/review-section';

export { generateHowToSection } from '../src/sections/howto-section';
export type {
  HowToStep,
  HowToSectionData,
  HowToSectionOptions,
} from '../src/sections/howto-section';

export { generateOpinionSection } from '../src/sections/opinion-section';
export type { OpinionSectionData, OpinionSectionOptions } from '../src/sections/opinion-section';

export { generateComparisonSection } from '../src/sections/comparison-section';
export type {
  ComparisonItem,
  ComparisonSectionData,
  ComparisonSectionOptions,
} from '../src/sections/comparison-section';

export { generateCaseStudySection } from '../src/sections/case-study-section';
export type {
  CaseStudySectionData,
  CaseStudySectionOptions,
} from '../src/sections/case-study-section';

export { generateInterviewSection } from '../src/sections/interview-section';
export type {
  InterviewSectionData,
  InterviewSectionOptions,
} from '../src/sections/interview-section';
