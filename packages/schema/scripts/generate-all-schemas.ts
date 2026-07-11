#!/usr/bin/env tsx
/**
 * Build-time schema generator.
 *
 * Generates sample JSON-LD output for all content types and writes them
 * to __tests__/fixtures/expected/ for use as snapshot fixtures.
 *
 * Usage:  tsx scripts/generate-all-schemas.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateHackathonSchema,
  generateConferenceSchema,
  generateWebinarSchema,
  generateMeetupSchema,
  generateWorkshopSchema,
  generateCompetitionSchema,
  generateBootcampSchema,
} from '../schemas/content/event/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '../__tests__/fixtures/expected');

function writeFixture(name: string, data: unknown): void {
  mkdirSync(FIXTURES_DIR, { recursive: true });
  const filePath = join(FIXTURES_DIR, `${name}.json`);
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`  ✅  Generated ${name}.json`);
}

console.log('\n🏗️   Generating schema fixtures...\n');

const BASE_EVENT = {
  name: 'Vedify Hackathon 2025',
  description: 'Annual coding challenge',
  url: 'https://vedify.in/events/hackathon-2025',
  startDate: '2025-08-01',
  endDate: '2025-08-03',
  location: {
    name: 'Bangalore Tech Hub',
    address: { addressLocality: 'Bangalore', addressCountry: 'IN' },
  },
  organizer: { name: 'Vedify', url: 'https://vedify.in' },
};

writeFixture(
  'hackathon',
  generateHackathonSchema(
    { ...BASE_EVENT, prize: '₹1,00,000' },
    'https://vedify.in/events/hackathon-2025#content',
  ),
);
writeFixture(
  'conference',
  generateConferenceSchema(
    { ...BASE_EVENT, name: 'Vedify Conf 2025' },
    'https://vedify.in/events/conf-2025#content',
  ),
);
writeFixture(
  'webinar',
  generateWebinarSchema(
    {
      name: 'TypeScript Deep Dive',
      startDate: '2025-09-15',
      onlineUrl: 'https://meet.vedify.in/ts-deep-dive',
      organizer: { name: 'Vedify' },
    },
    'https://vedify.in/events/webinar-ts#content',
  ),
);
writeFixture('meetup', generateMeetupSchema({ ...BASE_EVENT, name: 'Bangalore JS Meetup' }));
writeFixture(
  'workshop',
  generateWorkshopSchema({
    ...BASE_EVENT,
    name: 'React Workshop',
    instructor: [{ name: 'Vaidic Joshi' }],
  }),
);
writeFixture(
  'competition',
  generateCompetitionSchema({ ...BASE_EVENT, name: 'Code Golf 2025', prize: '₹50,000' }),
);
writeFixture(
  'bootcamp',
  generateBootcampSchema({ ...BASE_EVENT, name: 'Full-Stack Bootcamp', duration: 'P8W' }),
);

console.log('\n✅  All fixtures generated.\n');
