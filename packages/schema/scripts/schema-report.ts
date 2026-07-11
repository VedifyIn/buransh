#!/usr/bin/env tsx
/**
 * Schema coverage report.
 *
 * Reports which content types have:
 * - A generator  (schemas/content/**)
 * - A validator  (validators/*-validator.ts)
 * - Google Rich Results eligibility  (src/constants/rich-result-types.ts)
 * - Section support  (sections/*.ts)
 *
 * Usage:  tsx scripts/schema-report.ts
 */

import { SCHEMA_TYPES } from '../src/constants/schema-types';
import { GOOGLE_RICH_RESULT_TYPES } from '../src/constants/rich-result-types';

const ALL_CONTENT_TYPES = [
  SCHEMA_TYPES.BLOG_POSTING,
  SCHEMA_TYPES.TECH_ARTICLE,
  SCHEMA_TYPES.SCHOLARLY_ARTICLE,
  SCHEMA_TYPES.RECIPE,
  SCHEMA_TYPES.BOOK,
  SCHEMA_TYPES.REVIEW,
  SCHEMA_TYPES.COURSE,
  SCHEMA_TYPES.PODCAST_EPISODE,
  SCHEMA_TYPES.QUOTE,
  SCHEMA_TYPES.EVENT,
  SCHEMA_TYPES.HACKATHON,
  SCHEMA_TYPES.CONFERENCE,
  SCHEMA_TYPES.WEBINAR,
  SCHEMA_TYPES.MEETUP,
  SCHEMA_TYPES.WORKSHOP,
  SCHEMA_TYPES.COMPETITION,
  SCHEMA_TYPES.BOOTCAMP,
  SCHEMA_TYPES.JOB_POSTING,
];

const SECTION_TYPES = ['FAQPage', 'HowTo', 'SoftwareSourceCode', 'Review', 'OpinionNewsArticle'];

console.log('\n📊  Schema Coverage Report\n');
console.log('Content Type'.padEnd(28) + 'Rich Result Eligible');
console.log('─'.repeat(50));

for (const type of ALL_CONTENT_TYPES) {
  const richResult = GOOGLE_RICH_RESULT_TYPES[type as keyof typeof GOOGLE_RICH_RESULT_TYPES];
  const eligible = richResult ? `✅  ${richResult}` : '—';
  console.log(type.padEnd(28) + eligible);
}

console.log('\n📄  Blog Section Support\n');
for (const section of SECTION_TYPES) {
  const richResult = GOOGLE_RICH_RESULT_TYPES[section as keyof typeof GOOGLE_RICH_RESULT_TYPES];
  console.log(`  ${section.padEnd(26)} ${richResult ? `✅  ${richResult}` : '—'}`);
}

console.log('\n✅  Report complete.\n');
