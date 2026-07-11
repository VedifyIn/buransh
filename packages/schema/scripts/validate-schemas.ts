#!/usr/bin/env tsx
/**
 * Build-time schema validator.
 *
 * Validates all schemas in the package against:
 * 1. Google Rich Results requirements
 * 2. Graph structural rules (@id uniqueness, @type presence)
 *
 * Exit code 0 = all valid, 1 = failures found.
 *
 * Usage:  tsx scripts/validate-schemas.ts
 */

import { validateForGoogleRichResults, validateGraph } from '../validators/index';
import type { SchemaNode } from '../src/validators/base-validator';

// ── Sample schemas to validate at build time ──────────────────────────
// These represent the minimum expected output for each content type.
// In a real CI run you'd import actual generated schemas from your pages.

const BASE_URL = 'https://vedify.in';

const sampleSchemas: { name: string; schema: SchemaNode }[] = [
  {
    name: 'WebSite',
    schema: {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'Vedify',
    },
  },
  {
    name: 'BlogPosting',
    schema: {
      '@type': 'BlogPosting',
      '@id': `${BASE_URL}/blog/test#content`,
      headline: 'Test Blog Post',
      author: { '@type': 'Person', name: 'Vaidic Joshi' },
      datePublished: '2025-01-15',
      image: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/images/test.jpg`,
        width: 1200,
        height: 630,
      },
    },
  },
  {
    name: 'FAQPage',
    schema: {
      '@type': 'FAQPage',
      '@id': `${BASE_URL}/blog/test#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Vedify?',
          acceptedAnswer: { '@type': 'Answer', text: 'A tech content platform.' },
        },
        {
          '@type': 'Question',
          name: 'Who writes at Vedify?',
          acceptedAnswer: { '@type': 'Answer', text: 'Vaidic Joshi.' },
        },
      ],
    },
  },
  {
    name: 'Event (Hackathon)',
    schema: {
      '@type': 'Hackathon',
      '@id': `${BASE_URL}/events/hack-2025#content`,
      name: 'Hack 2025',
      startDate: '2025-08-01',
      location: { '@type': 'Place', name: 'Bangalore' },
    },
  },
  {
    name: 'JobPosting',
    schema: {
      '@type': 'JobPosting',
      '@id': `${BASE_URL}/jobs/swe-2025#content`,
      title: 'Software Engineer',
      description: 'Build cool products.',
      datePosted: '2025-01-01',
      hiringOrganization: { '@type': 'Organization', name: 'Vedify' },
    },
  },
  {
    name: 'Course',
    schema: {
      '@type': 'Course',
      '@id': `${BASE_URL}/courses/ts-basics#content`,
      name: 'TypeScript Basics',
      description: 'Learn TypeScript from scratch.',
      provider: { '@type': 'Organization', name: 'Vedify' },
    },
  },
];

// ── Validation run ────────────────────────────────────────────────────

let failures = 0;
const allNodes: SchemaNode[] = sampleSchemas.map((s) => s.schema);

console.log('🔍  Running schema validation...\n');

// Per-schema Rich Results check
for (const { name, schema } of sampleSchemas) {
  const result = validateForGoogleRichResults(schema);
  if (!result.valid) {
    console.error(`  ❌  ${name}`);
    for (const issue of result.issues) {
      console.error(`       - [${issue.field}] ${issue.message}`);
    }
    failures++;
  } else {
    console.log(`  ✅  ${name}`);
  }
}

// Full graph structural check
console.log('\n🔍  Running graph validation...\n');
const graphResult = validateGraph(allNodes);
if (!graphResult.valid) {
  console.error('  ❌  Graph issues:');
  for (const issue of graphResult.issues) {
    console.error(`       - [${issue.field}] ${issue.message}`);
  }
  failures++;
} else {
  console.log(`  ✅  Graph OK — ${graphResult.nodeCount} nodes, ${graphResult.jsonSize} bytes`);
}

console.log('');
if (failures > 0) {
  console.error(`❌  ${failures} schema(s) failed validation. Fix before deploying.\n`);
  process.exit(1);
} else {
  console.log('✅  All schemas valid.\n');
  process.exit(0);
}
