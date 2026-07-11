/**
 * Priority map for schema graph ordering.
 * Lower numbers appear first in the @graph array.
 *
 * Layer 1 (1–9):   Identity & Navigation — always first
 * Layer 2 (10–49): Primary content — main entity of the page
 * Layer 3 (50–59): Blog sections — rich result eligible sub-schemas
 * Layer 4 (60–69): People & Organizations — supporting entities
 * Layer 5 (70–79): Lists & Collections — aggregate content
 * Layer 6 (80–89): Media — images, video, audio
 * Layer 7 (90–94): Resources & Tools
 * Layer 8 (95–99): Engagement — ratings, comments, interactions
 */
export const SCHEMA_PRIORITY = {
  // ── Layer 1: Identity & Navigation ───────────────────────────
  WEBSITE: 1,
  WEBPAGE: 2,
  BREADCRUMB: 3,

  // ── Layer 2: Primary Content ──────────────────────────────────
  // Education
  COURSE: 10,
  CERTIFICATION: 11,

  // Events
  HACKATHON: 20,
  CONFERENCE: 21,
  COMPETITION: 22,
  WORKSHOP: 23,
  WEBINAR: 24,
  MEETUP: 25,
  BOOTCAMP: 26,

  // Career
  JOB_POSTING: 30,
  INTERNSHIP: 31,

  // Content
  BLOG_POSTING: 40,
  TECH_ARTICLE: 41,
  ARTICLE: 42,
  NOTES: 43,
  GIST: 44,
  QUOTE: 45,
  PROJECT: 46,
  RECIPE: 47,
  BOOK: 48,
  PODCAST: 49,

  // ── Layer 3: Blog Sections ────────────────────────────────────
  FAQ_SECTION: 50,
  HOWTO_SECTION: 51,
  REVIEW_SECTION: 52,
  CODE_SECTION: 53,
  OPINION_SECTION: 54,
  COMPARISON_SECTION: 55,
  CASE_STUDY_SECTION: 56,
  INTERVIEW_SECTION: 57,

  // ── Layer 4: People & Organizations ──────────────────────────
  AUTHOR: 60,
  SPEAKER: 61,
  MENTOR: 62,
  ORGANIZATION: 63,

  // ── Layer 5: Lists ────────────────────────────────────────────
  LEADERBOARD: 70,
  SEARCH_RESULTS: 71,
  COLLECTION: 72,

  // ── Layer 6: Media ────────────────────────────────────────────
  PRIMARY_IMAGE: 80,
  VIDEO: 81,
  AUDIO: 82,

  // ── Layer 7: Resources & Tools ────────────────────────────────
  RESOURCE: 90,
  TOOL: 91,

  // ── Layer 8: Engagement ───────────────────────────────────────
  COMMENTS: 95,
  REVIEW: 96,
  RATING: 97,
  INTERACTIONS: 98,
} as const;

export type SchemaPriorityKey = keyof typeof SCHEMA_PRIORITY;
export type SchemaPriorityValue = (typeof SCHEMA_PRIORITY)[SchemaPriorityKey];

/**
 * A schema node tagged with a priority for graph ordering
 */
export interface PrioritizedSchema {
  priority: SchemaPriorityValue | number;
  schema: Record<string, unknown>;
}

/**
 * Sort an array of prioritized schemas by priority (ascending).
 * Schemas with the same priority retain their original order (stable sort).
 */
export function sortByPriority(items: PrioritizedSchema[]): PrioritizedSchema[] {
  return [...items].sort((a, b) => a.priority - b.priority);
}

/**
 * Extract just the schema objects from a sorted list
 */
export function extractSortedSchemas(items: PrioritizedSchema[]): Record<string, unknown>[] {
  return sortByPriority(items).map((item) => item.schema);
}

/**
 * Look up priority for a given key, with a safe fallback
 */
export function getPriority(key: string, fallback: number = 50): number {
  const upper = key.toUpperCase().replace(/-/g, '_') as SchemaPriorityKey;
  return upper in SCHEMA_PRIORITY ? SCHEMA_PRIORITY[upper] : fallback;
}
