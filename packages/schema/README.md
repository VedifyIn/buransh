# @vedify/schema

Canonical schema.org JSON-LD generation and frontmatter validation for all Vedify content types.

Provides three layers:

1. **Zod validation** — parse and type-check content frontmatter at the data layer
2. **JSON-LD generation** — produce structured data for every content type
3. **Composition** — assemble, prioritise, deduplicate and validate full page `@graph` arrays

---

## Table of Contents

- [Package Structure](#package-structure)
- [Imports / Exports](#imports--exports)
- [Frontmatter Validation Layer](#frontmatter-validation-layer)
- [JSON-LD Generation — SchemaLibrary](#json-ld-generation--schemalibrary)
- [Composer](#composer)
- [Event Subtype Generators](#event-subtype-generators)
- [Blog Section Generators](#blog-section-generators)
- [Validators](#validators)
- [Constants](#constants)
- [Errors](#errors)
- [Build Scripts](#build-scripts)
- [Tests](#tests)
- [Content Type → Schema Mapping](#content-type--schema-mapping)
- [Priority Map Reference](#priority-map-reference)
- [Google Rich Results Eligibility](#google-rich-results-eligibility)

---

## Package Structure

```
packages/schema/
│
├── src/                          Frontmatter validation (Zod) + JSON-LD generation
│   ├── base.ts                   Base fields every page has
│   ├── enums.ts                  ContentType, difficulty, topic, intent … enums
│   ├── nested.ts                 Sub-object schemas (image, video, faq, ingredient …)
│   ├── index.ts                  Discriminated union + helpers + re-exports
│   ├── policy-enforcer.ts        Soft content quality warnings
│   ├── types/
│   │   └── identifiers.ts        EntityType union + ID patterns for all 45+ types
│   ├── constants/                Centralised constants (single source of truth)
│   │   ├── schema-types.ts       All schema.org @type strings
│   │   ├── required-fields.ts    Required fields (Google Rich Results + structural)
│   │   ├── rich-result-types.ts  Google rich result category per schema type
│   │   ├── enum-values.ts        Event attendance modes, status, employment types …
│   │   └── default-values.ts     DEFAULT_VALUES + GRAPH_LIMITS
│   ├── mappings/                 Semantic tag, flag, and schema type maps (centralised branching)
│   │   ├── index.ts              Re-exports everything
│   │   ├── schema-type-map.ts    ContentType → schema.org @type
│   │   ├── content-type-flags.ts Behavioral flags per ContentType
│   │   ├── semantic-tags.ts      ContentType → semantic HTML tags
│   │   ├── component-tags.ts     Rich text blocks → HTML elements
│   │   ├── media-tags.ts         Media → HTML elements
│   │   └── helpers.ts            getSemanticTags(), getContainerTag(), getOgType() …
│   ├── partials/
│   │   └── organization-fragment.ts  Reusable Organization sub-schema
│   ├── utils/
│   │   ├── id-generator.ts       @id generation, slugify, collision detection
│   │   ├── merger.ts             deepMerge, mergeWithPriority, mergeAndDeduplicate
│   │   ├── sanitizer.ts          Strip HTML, truncate, validate URLs/dates
│   │   └── transformer.ts        Transform raw data to schema-ready objects
│   ├── schema-library/
│   │   ├── building-blocks.ts    WebSite/WebPage/Author/Org/FAQ/Breadcrumb/Video
│   │   ├── content-types.ts      BlogPosting, TechArticle, Recipe, Book, Course …
│   │   ├── measurements.ts       NutritionInformation, Rating schemas
│   │   └── index.ts              SchemaLibrary class — getAll()
│   └── variants/                 Per-content-type Zod schemas
│       ├── simple.ts             BlogPost, Essay, Opinion, Gist, QuickNote …
│       ├── tutorial-code.ts      Tutorial, CodeSnippet
│       ├── recipe.ts             Recipe
│       ├── book.ts               Book, BookReview
│       ├── research.ts           ResearchPaper, Patent
│       ├── podcast.ts            PodcastEpisode
│       ├── quote.ts              Quote
│       └── course.ts             Course, CourseLesson
│
├── composer/                     Graph assembly, ordering, deduplication
│   ├── priority-map.ts           SCHEMA_PRIORITY — 8-layer ordering (1–99)
│   ├── graph-builder.ts          GraphBuilder — fluent API
│   ├── deduplicator.ts           deduplicateGraph() — remove duplicate @id nodes
│   ├── entity-linker.ts          EntityLinker — register/resolve @id cross-refs
│   ├── optimizer.ts              stripEmpty, truncateStrings, optimizeGraph
│   └── index.ts                  Re-exports everything
│
├── validators/                   Schema correctness checks
│   ├── base-validator.ts         checkRequiredFields, checkUrl, checkDate, runChecks
│   ├── google-rich-results.ts    11 type-specific Google Rich Results validators
│   ├── graph-validator.ts        Full @graph structural validation
│   ├── event-validator.ts        Event-specific checks
│   ├── job-validator.ts          JobPosting checks
│   ├── person-validator.ts       Person schema checks
│   ├── organization-validator.ts Organization checks
│   ├── creative-work-validator.ts Article/SoftwareSourceCode checks
│   └── index.ts                  Re-exports everything
│
├── sections/                     Blog section schema generators
│   ├── faq-section.ts            FAQPage
│   ├── howto-section.ts          HowTo (with steps, tools, supply)
│   ├── code-section.ts           SoftwareSourceCode
│   ├── review-section.ts         Review snippet
│   ├── opinion-section.ts        OpinionNewsArticle
│   ├── comparison-section.ts     ItemList comparison table
│   ├── case-study-section.ts     Article (case study)
│   ├── interview-section.ts      Article (interview format)
│   └── index.ts                  Re-exports everything
│
├── schemas/
│   ├── content/event/            All 7 event subtype generators
│   │   ├── event-base.ts         Shared base + location/offer helpers
│   │   ├── hackathon.ts
│   │   ├── conference.ts
│   │   ├── webinar.ts
│   │   ├── meetup.ts
│   │   ├── workshop.ts
│   │   ├── competition.ts
│   │   └── bootcamp.ts
│   └── supporting/
│       └── organization-fragment.ts  Configurable org fragment
│
├── constants/
│   └── index.ts                  Re-exports from src/constants/ (public entrypoint)
│
├── errors/                       Typed error classes
│   ├── schema-error.ts           SchemaError (base)
│   ├── validation-error.ts       ValidationError + ValidationIssue
│   ├── id-error.ts               IdError
│   ├── type-error.ts             SchemaTypeError
│   └── index.ts                  Re-exports everything
│
├── scripts/                      Build-time CLI tools
│   ├── validate-schemas.ts       Run Google Rich Results + graph validation
│   ├── generate-all-schemas.ts   Generate fixture JSON for all event subtypes
│   └── schema-report.ts          Coverage table: types vs rich result eligibility
│
└── __tests__/
    └── unit/
        ├── composer/             deduplicator, priority-map tests
        ├── utils/                id-generator, merger, sanitizer, transformer tests
        └── validators/           google-rich-results tests
```

---

## Imports / Exports

```ts
// Frontmatter validation
import { contentSchema, validateFrontmatter, enforcePolicy } from '@vedify/schema';
import type {
  ContentFrontmatter,
  ResolvedAuthor,
  GraphSchema,
  OrganizationConfig,
} from '@vedify/schema';

// JSON-LD generation
import { SchemaLibrary } from '@vedify/schema/schema-library';

// Composer (graph assembly)
import { GraphBuilder, SCHEMA_PRIORITY, deduplicateGraph } from '@vedify/schema/composer';

// Validators
import { validateForGoogleRichResults, validateGraph } from '@vedify/schema/validators';

// Blog sections
import { generateFaqSection, generateHowToSection } from '@vedify/schema/sections';

// Event generators
import { generateHackathonSchema, generateWebinarSchema } from '@vedify/schema/schemas/event';

// Mappings (semantic tags, flags, schema type maps)
import {
  CONTENT_TO_SCHEMA_TYPE,
  CONTENT_TYPE_FLAGS,
  CONTENT_SEMANTIC_TAGS,
  getContainerTag,
  getOgType,
  getSchemaTypeForContent,
  getSemanticTags,
  isValidContentType,
  getContentTypeLabel,
} from '@vedify/schema';

// Constants
import { SCHEMA_TYPES, REQUIRED_FIELDS, GRAPH_LIMITS } from '@vedify/schema/constants';

// Errors
import { ValidationError, SchemaError } from '@vedify/schema/errors';
```

---

## Frontmatter Validation Layer

### Content types (22 total)

| Variant schema        | Types                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| `simpleContentSchema` | BlogPost, Essay, Opinion, ShortStory, Folktale, Gist, QuickNote, SeriesOverview, Devotional, LegalPage, AboutMe |
| `tutorialCodeSchema`  | Tutorial, CodeSnippet                                                                                           |
| `recipeSchema`        | Recipe                                                                                                          |
| `bookSchema`          | Book, BookReview                                                                                                |
| `researchSchema`      | ResearchPaper, Patent                                                                                           |
| `podcastSchema`       | PodcastEpisode                                                                                                  |
| `quoteSchema`         | Quote                                                                                                           |
| `courseSchema`        | Course, CourseLesson                                                                                            |

### Base fields (every content type)

`id`, `title`, `description`, `datePublished`, `dateModified`, `author`, `status`, `intent`, `topic`, `tags`, `categories`, `series`, `seriesPart`, `seriesTitle`, `totalParts`, `image`, `video`, `faqs`, `readingTime`, `difficulty`, `layout`, `canonical`, `noIndex`, `twitterCard`, `socialImage`, `aeoDirectAnswer`, `seoPriority`, `evergreen`, `featured`

### Parsing

```ts
import { validateFrontmatter } from '@vedify/schema';

const fm = validateFrontmatter(rawData); // throws ZodError on invalid input
```

### Cross-field rules (enforced at parse time)

| Rule                                     | Message                                              |
| ---------------------------------------- | ---------------------------------------------------- |
| `seriesPart` > `totalParts`              | `seriesPart must not exceed totalParts`              |
| `series` set without `seriesPart`        | `seriesPart is required when series is set`          |
| `tags` set without `topic`               | `topic is required when tags are set`                |
| Course/CourseLesson without `difficulty` | `difficulty is required for Course and CourseLesson` |

### Mappings (semantic tags, flags, schema type maps)

The `mappings/` module centralises all ContentType-based branching decisions into single-source-of-truth maps, eliminating switch/if chains scattered across the codebase.

```ts
import {
  getSemanticTags,
  getContainerTag,
  getOgType,
  getSchemaTypeForContent,
  isValidContentType,
  getContentTypeLabel,
  CONTENT_TO_SCHEMA_TYPE,
  CONTENT_TYPE_FLAGS,
  CONTENT_SEMANTIC_TAGS,
} from '@vedify/schema';

// Get semantic HTML tags for a content type
const tags = getSemanticTags('BlogPost');
// → { container: 'article', heading: 'h1', schemaType: 'BlogPosting', breadcrumb: true, ... }

// Get container HTML element
const tag = getContainerTag('Quote'); // → 'figure'

// Get OG type for social meta
const og = getOgType('BlogPost'); // → 'article'

// Look up schema.org @type
const st = getSchemaTypeForContent('Tutorial'); // → 'TechArticle'

// Type guard
if (isValidContentType('SomeType')) {
  /* ... */
}

// Human-readable label
const label = getContentTypeLabel('BlogPost'); // → 'Posts'

// Behavioral flags
const flags = CONTENT_TYPE_FLAGS['CourseLesson'];
// → { isArticle: true, hasAeo: false, difficultyRequired: true, ogType: 'website', ... }
```

Refer to `src/mappings/` source for the complete data maps. Adding a new content type requires updating `enums.ts` plus these maps — all downstream consumers (SchemaLibrary, policy enforcer, layouts, search) adapt automatically.

### Policy Enforcer (soft warnings)

```ts
import { enforcePolicy } from '@vedify/schema';

const result = enforcePolicy(fm, bodyContent);
// result.warnings → [{ field, message }]
```

Checks: missing hero image, missing `aeoDirectAnswer`, content too short/long, no internal links, missing FAQ.

---

## JSON-LD Generation — SchemaLibrary

`SchemaLibrary` produces a fully ordered, deduplicated array of JSON-LD schemas for any content page.

```ts
import { SchemaLibrary } from '@vedify/schema/schema-library';
import type { ResolvedAuthor, OrganizationConfig } from '@vedify/schema/schema-library';

const author: ResolvedAuthor = {
  name: 'Vaidic Joshi',
  url: 'https://vedify.in/about-me',
  avatar: '/images/avatar.jpg',
  sameAs: ['https://twitter.com/vaidicjoshi'],
};

const lib = new SchemaLibrary('https://vedify.in', frontmatter, author, {
  name: 'Vedify',
  logo: '/logo.png',
  sameAs: ['https://twitter.com/vedify'],
});
const schemas = lib.getAll();
// or: const graph = lib.getAllAsGraph();
// graph → { '@context': 'https://schema.org', '@graph': [...] }
```

`getAll()` returns a bare array of schema nodes (no `@context` on individual nodes), sorted by `SCHEMA_PRIORITY` and deduplicated by `@id`:

```
[WebSite, WebPage, BreadcrumbList, <content>, FAQPage?, Author, Organization, VideoObject?]
 ← Layer 1 (1-3) ────────────────  Layer 2 (40) ──  L3(50) ─  Layer 4 (60-63) ─  L6(81) →
```

`getAllAsGraph()` wraps the array in the standard JSON-LD `@context` + `@graph` envelope — the recommended output for embedding on a page.

The 4th constructor argument `orgConfig` is optional (`OrganizationConfig`). When omitted, fallback defaults (name: `"Vedify"`, logo: `"<baseUrl>/logo.png"`, no address/socials) are used.

### Content type → JSON-LD schema mapping

| Content type(s)                                   | Schema `@type`        |
| ------------------------------------------------- | --------------------- |
| BlogPost, Essay                                   | `BlogPosting`         |
| Tutorial                                          | `TechArticle`         |
| CodeSnippet                                       | `SoftwareSourceCode`  |
| ShortStory, Folktale, Gist, QuickNote, Devotional | `Article`             |
| Opinion                                           | `OpinionNewsArticle`  |
| SeriesOverview                                    | `CollectionPage`      |
| AboutMe                                           | `ProfilePage`         |
| LegalPage                                         | — (no content schema) |
| Recipe                                            | `Recipe`              |
| Book                                              | `Book`                |
| BookReview                                        | `Review`              |
| Course, CourseLesson                              | `Course`              |
| PodcastEpisode                                    | `PodcastEpisode`      |
| ResearchPaper                                     | `ScholarlyArticle`    |
| Patent                                            | `Patent`              |
| Quote                                             | `Quote`               |

### Common fields (Article-derived types)

Every `Article`-derived schema (`BlogPosting`, `Article`, `OpinionNewsArticle`, `TechArticle`, `ScholarlyArticle`) shares these fields via `commonArticleFields()`:

`@id`, `url`, `headline`, `description`, `datePublished`, `dateModified`, `inLanguage`, `author` (→ `@id`), `publisher` (→ `@id`), `image`, `mainEntityOfPage`, `keywords`, `articleSection`, `isPartOf`

`TechArticle` additionally includes `proficiencyLevel`, `about` (SoftwareApplication), `codeRepository`, `dependencies`, `hasPart` (code snippet).

### `@context` removal

Individual schema functions no longer carry `@context`. It is set once at the graph level:

- `getAllAsGraph()` adds `'@context': 'https://schema.org'` at the top level.
- When using `getAll()` directly, consumers must wrap the array in their own `@context` + `@graph` envelope.

### GraphSchema

```ts
type GraphSchema = {
  '@context': 'https://schema.org';
  '@graph': Record<string, unknown>[];
};
```

Returned by `getAllAsGraph()` — the standard JSON-LD `@graph` envelope for embedding in page `<script>` tags.

### OrganizationConfig

All fields optional. When omitted, fallback defaults are used (name: `"Vedify"`, logo: `"<baseUrl>/logo.png"`, no address/socials).

| Field         | Type        | Notes                              |
| ------------- | ----------- | ---------------------------------- |
| `name`        | `string?`   | Organization name (default Vedify) |
| `legalName`   | `string?`   | Registered legal name              |
| `url`         | `string?`   | Organization homepage              |
| `logo`        | `string?`   | Relative or absolute logo URL      |
| `description` | `string?`   | Short description                  |
| `email`       | `string?`   | Contact email                      |
| `phone`       | `string?`   | Contact phone                      |
| `sameAs`      | `string[]?` | Social profile URLs                |
| `address`     | `object?`   | Postal address (see below)         |

**`address` sub-fields** (all optional): `streetAddress`, `addressLocality`, `addressRegion`, `postalCode`, `addressCountry`.

### ResolvedAuthor fields

| Field    | Type        | Notes                |
| -------- | ----------- | -------------------- |
| `name`   | `string`    | Required             |
| `url`    | `string?`   | Relative or absolute |
| `avatar` | `string?`   | Relative or absolute |
| `sameAs` | `string[]?` | Social profile URLs  |

---

## Composer

The `composer/` module handles graph assembly independently of `SchemaLibrary`, useful when building custom page schemas.

### GraphBuilder

Fluent API for constructing `@graph` documents:

```ts
import { GraphBuilder, SCHEMA_PRIORITY } from '@vedify/schema/composer';

const graph = new GraphBuilder('https://vedify.in')
  .add(websiteSchema, SCHEMA_PRIORITY.WEBSITE)
  .add(webpageSchema, SCHEMA_PRIORITY.WEBPAGE)
  .add(blogPostSchema, SCHEMA_PRIORITY.BLOG_POSTING)
  .add(authorSchema, SCHEMA_PRIORITY.AUTHOR)
  .addIfPresent(faqSchema, SCHEMA_PRIORITY.FAQ_SECTION)
  .build();

// Returns: { '@context': 'https://schema.org', '@graph': [...sorted, deduplicated] }
```

### Deduplicator

```ts
import { deduplicateGraph, hasDuplicates } from '@vedify/schema/composer';

// First occurrence wins (default)
const clean = deduplicateGraph(graph);

// Deep-merge duplicates instead
const merged = deduplicateGraph(graph, { merge: true });

hasDuplicates(graph); // → boolean
```

### EntityLinker

Tracks `@id` cross-references so related entities always use the same canonical ID:

```ts
import { EntityLinker } from '@vedify/schema/composer';

const linker = new EntityLinker();
linker.register('author', 'https://vedify.in/#author');

// Use in a schema
const blogPost = {
  '@type': 'BlogPosting',
  author: linker.ref('author'), // → { '@id': 'https://vedify.in/#author' }
};

// Validate all refs resolve
const unresolved = linker.validateGraph(graphNodes); // → string[]
```

### Optimizer

```ts
import { optimizeGraph, stripEmpty } from '@vedify/schema/composer';

const { graph, warnings } = optimizeGraph(rawGraph);
// warnings → e.g. "Graph has 35 nodes, exceeds recommended limit of 30"
```

---

## Event Subtype Generators

All 7 event subtypes share a common base and extend it with type-specific fields.

```ts
import {
  generateHackathonSchema,
  generateConferenceSchema,
  generateWebinarSchema,
  generateMeetupSchema,
  generateWorkshopSchema,
  generateCompetitionSchema,
  generateBootcampSchema,
} from '@vedify/schema/schemas/event';
```

### Common base fields (`EventBaseData`)

`name`, `description`, `url`, `startDate`, `endDate`, `image`, `eventStatus`, `eventAttendanceMode`, `organizer`, `location` (Place with address + geo), `virtualLocation`, `offers`, `performer`

### Type-specific extras

| Generator                   | Extra fields                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `generateHackathonSchema`   | `prize`, `judgingCriteria`, `competitor[]`, `numberOfParticipants`, `registrationDeadline`, `themes[]` |
| `generateConferenceSchema`  | `speaker[]`, `tracks[]`, `schedule[]`                                                                  |
| `generateWebinarSchema`     | `onlineUrl` (required), `recording`, `presenter[]` — forces `OnlineEventAttendanceMode`                |
| `generateMeetupSchema`      | `attendeeCapacity`, `group`, `topics[]`                                                                |
| `generateWorkshopSchema`    | `instructor[]`, `materials[]`, `prerequisites[]`, `maxCapacity`                                        |
| `generateCompetitionSchema` | `prize`, `rules`, `submissionDeadline`, `judges[]`                                                     |
| `generateBootcampSchema`    | `instructor[]`, `curriculum[]`, `certificateOffered`, `duration` (ISO 8601), `prerequisites[]`         |

### Example

```ts
const schema = generateHackathonSchema(
  {
    name: 'Vedify Hack 2025',
    startDate: '2025-08-01',
    endDate: '2025-08-03',
    location: {
      name: 'Bangalore Tech Hub',
      address: { addressLocality: 'Bangalore', addressCountry: 'IN' },
    },
    organizer: { name: 'Vedify', url: 'https://vedify.in' },
    prize: '₹1,00,000',
    offers: [{ price: 0, priceCurrency: 'INR', url: 'https://vedify.in/hack/register' }],
  },
  'https://vedify.in/events/hack-2025#content',
);
```

---

## Blog Section Generators

Each section generator produces a standalone JSON-LD node that can be pushed into a `@graph`.

```ts
import {
  generateFaqSection,
  generateHowToSection,
  generateCodeSection,
  generateReviewSection,
  generateOpinionSection,
  generateComparisonSection,
  generateCaseStudySection,
  generateInterviewSection,
} from '@vedify/schema/sections';
```

| Generator                   | Schema `@type`       | Google Rich Result           |
| --------------------------- | -------------------- | ---------------------------- |
| `generateFaqSection`        | `FAQPage`            | ✅ FAQ (needs ≥ 2 Q&A pairs) |
| `generateHowToSection`      | `HowTo`              | ✅ How-to                    |
| `generateReviewSection`     | `Review`             | ✅ Review Snippet            |
| `generateOpinionSection`    | `OpinionNewsArticle` | ✅ Article                   |
| `generateCodeSection`       | `SoftwareSourceCode` | —                            |
| `generateComparisonSection` | `ItemList`           | —                            |
| `generateCaseStudySection`  | `Article`            | —                            |
| `generateInterviewSection`  | `Article`            | —                            |

### FAQ example

```ts
const faq = generateFaqSection(
  [
    { question: 'What is Vedify?', answer: 'A tech content hub.' },
    { question: 'Who writes here?', answer: 'Vaidic Joshi.' },
  ],
  { id: 'https://vedify.in/blog/post#faq', pageId: 'https://vedify.in/blog/post#webpage' },
);
```

### HowTo example

```ts
const howTo = generateHowToSection({
  name: 'How to set up TypeScript',
  totalTime: 'PT15M',
  steps: [
    { text: 'Install Node.js' },
    { text: 'Run npm init' },
    { text: 'Install typescript and ts-node', name: 'Install TS' },
  ],
});
```

---

## Validators

All validators return `{ valid: boolean, issues: ValidationIssue[] }`.

### Google Rich Results validator

Checks the minimum required fields for each Google Rich Result type:

```ts
import { validateForGoogleRichResults, validateGraphForGoogle } from '@vedify/schema/validators';

// Single node
const result = validateForGoogleRichResults(schema);
if (!result.valid) {
  result.issues.forEach((i) => console.error(`[${i.field}] ${i.message}`));
}

// Entire @graph
const graphResult = validateGraphForGoogle(graph);
```

Supported types and their required fields:

| Type                                | Required fields                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| Article / BlogPosting / TechArticle | `headline`, `author`, `datePublished`, `image` (≤ 110 char headline)                |
| FAQPage                             | `mainEntity` with ≥ 2 Question/Answer pairs                                         |
| HowTo                               | `name`, `step[]` with at least one step                                             |
| Review                              | `reviewRating.ratingValue`, `itemReviewed`, `author`                                |
| Event                               | `name`, `startDate`, `location` (or online mode); `endDate` must follow `startDate` |
| JobPosting                          | `title`, `description`, `datePosted`, `hiringOrganization.name`                     |
| Course                              | `name`, `description`, `provider.name`                                              |
| VideoObject                         | `name`, `description`, `thumbnailUrl`, `uploadDate`                                 |
| SoftwareApplication                 | `name`, `operatingSystem`, `applicationCategory`                                    |
| BreadcrumbList                      | `itemListElement[]` with `position` on each item                                    |

### Graph validator

```ts
import { validateGraph } from '@vedify/schema/validators';

const result = validateGraph(graphNodes);
// result.nodeCount   → number of nodes
// result.jsonSize    → byte size of serialised graph
// result.unresolvedRefs → @id strings that are referenced but not defined
```

Checks: node count vs `GRAPH_LIMITS.maxNodes` (30), JSON size vs `GRAPH_LIMITS.maxJsonSize` (20 KB), duplicate `@id` values, `@type` present on every node.

### Type-specific validators

```ts
import {
  validateEventSchema,
  validateJobSchema,
  validatePersonSchema,
  validateOrganizationSchema,
  validateCreativeWorkSchema,
  validateSoftwareSourceCodeSchema,
} from '@vedify/schema/validators';
```

### Base utilities

```ts
import {
  checkRequiredFields,
  checkUrl,
  checkDate,
  runChecks,
  assertValid,
} from '@vedify/schema/validators';

// Build a custom validator
function validateMySchema(schema: Record<string, unknown>) {
  return runChecks([
    () => checkRequiredFields(schema, ['name', 'url']),
    () => checkUrl(schema, 'url'),
    () => checkDate(schema, 'datePublished'),
  ]);
}

// Throw on invalid
assertValid(validateMySchema(schema), { context: 'page build' });
```

---

## Constants

All constants live in `src/constants/` and are exported via `@vedify/schema/constants`.

```ts
import {
  SCHEMA_TYPES, // All schema.org @type strings as constants
  REQUIRED_FIELDS, // Google Rich Results required fields per type
  SCHEMA_REQUIRED_FIELDS, // Structural required fields per type
  RECOMMENDED_FIELDS, // Recommended fields for richer results
  GOOGLE_RICH_RESULT_TYPES, // Maps @type → rich result category
  DEFAULT_VALUES, // Site defaults (baseUrl, image dimensions, limits)
  GRAPH_LIMITS, // maxNodes: 30, maxJsonSize: 20480
  EVENT_ATTENDANCE_MODE,
  EVENT_STATUS,
  EMPLOYMENT_TYPE,
  COURSE_MODE,
  LANGUAGE_CODES,
} from '@vedify/schema/constants';
```

### GRAPH_LIMITS

| Constant           | Value | Meaning                               |
| ------------------ | ----- | ------------------------------------- |
| `maxNodes`         | 30    | Max `@graph` nodes per page           |
| `maxJsonSize`      | 20480 | Max JSON-LD bytes (20 KB)             |
| `maxGenerationMs`  | 10    | Target generation time per entity     |
| `maxCompositionMs` | 20    | Target composition time for full page |

---

## Errors

```ts
import { SchemaError, ValidationError, IdError, SchemaTypeError } from '@vedify/schema/errors';
import type { ValidationIssue } from '@vedify/schema/errors';

try {
  assertValid(result);
} catch (e) {
  if (e instanceof ValidationError) {
    console.error(e.issues); // → ValidationIssue[]
  }
}
```

| Class             | `code`             | Use                                                                   |
| ----------------- | ------------------ | --------------------------------------------------------------------- |
| `SchemaError`     | `SCHEMA_ERROR`     | Base class for all schema errors                                      |
| `ValidationError` | `VALIDATION_ERROR` | Failed required-field or type check — carries `issues[]`              |
| `IdError`         | `ID_ERROR`         | `@id` generation or resolution failure                                |
| `SchemaTypeError` | `TYPE_ERROR`       | Field type mismatch — carries `expectedType`, `receivedType`, `field` |

---

## Build Scripts

Run these with `tsx` (included via `npx tsx`):

```bash
# Validate all sample schemas against Google Rich Results + graph rules
pnpm validate          # exits 1 if any schema fails

# Generate fixture JSON files for all 7 event subtypes
pnpm generate          # writes to __tests__/fixtures/expected/

# Print schema coverage table (type → rich result eligibility)
pnpm report
```

### Integrating validate into CI

Add to your build/deploy pipeline:

```yaml
# .github/workflows/build.yml  (example)
- name: Validate schemas
  run: pnpm --filter @vedify/schema validate
```

`scripts/validate-schemas.ts` exits with code `1` when any schema fails, blocking the pipeline.

---

## Tests

```bash
pnpm test           # run once with coverage
pnpm test:watch     # watch mode
pnpm test:coverage  # explicit coverage report
pnpm check-types    # TypeScript check (no emit)
pnpm lint           # ESLint
```

### Test coverage (331 tests across 9 files)

| File                                                    | What it covers                                                                                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/index.test.ts`                                     | All Zod schemas, SchemaLibrary, building blocks, content-types (~250 tests)                                                                                  |
| `src/mappings/__tests__/mappings.test.ts`               | Component tags, content-type flags, media tags, semantic tags, schema type map                                                                               |
| `__tests__/unit/utils/id-generator.test.ts`             | `generateSchemaId`, `validateSchemaId`, `resolveId`, `slugify`, collision detection                                                                          |
| `__tests__/unit/utils/sanitizer.test.ts`                | `sanitizeText`, `sanitizeUrl`, `sanitizeImage`, `sanitizeDate`, `sanitizeFaqArray`, `sanitizeVideo`                                                          |
| `__tests__/unit/utils/merger.test.ts`                   | `deepMerge`, `mergeSchemas`, `mergeWithPriority`, `mergeAndDeduplicate`, `hasConflicts`                                                                      |
| `__tests__/unit/utils/transformer.test.ts`              | `transformDate`, `transformImage`, `transformVideo`, `transformFaqArray`, `transformPerson`, `transformOrganization`, `transformRating`, `transformItemList` |
| `__tests__/unit/composer/deduplicator.test.ts`          | `deduplicateGraph` (first-wins + merge mode), `hasDuplicates`, `countDuplicates`                                                                             |
| `__tests__/unit/composer/priority-map.test.ts`          | Layer ordering, `sortByPriority` stability, `getPriority`                                                                                                    |
| `__tests__/unit/validators/google-rich-results.test.ts` | All 11 Rich Results validators + dispatch + graph-wide validation                                                                                            |

---

## Content Type → Schema Mapping

Source of truth: `src/mappings/schema-type-map.ts` - `CONTENT_TO_SCHEMA_TYPE`.

The `SchemaLibrary.getContentSchema()` method dispatches on the schema `@type` (not the frontmatter `type`), using this map as the bridge.

### Blog content

| Frontmatter `type`                                | JSON-LD `@type`       | Rich Result       |
| ------------------------------------------------- | --------------------- | ----------------- |
| BlogPost, Essay                                   | BlogPosting           | ✅ Article        |
| Tutorial                                          | TechArticle           | ✅ Article        |
| CodeSnippet                                       | SoftwareSourceCode    | —                 |
| ShortStory, Folktale, Gist, QuickNote, Devotional | Article               | ✅ Article        |
| Opinion                                           | OpinionNewsArticle    | ✅ Article        |
| SeriesOverview                                    | CollectionPage        | —                 |
| AboutMe                                           | ProfilePage           | —                 |
| LegalPage                                         | — (no content schema) | —                 |
| ResearchPaper                                     | ScholarlyArticle      | ✅ Article        |
| Patent                                            | Patent                | —                 |
| Recipe                                            | Recipe                | —                 |
| Book                                              | Book                  | —                 |
| BookReview                                        | Review                | ✅ Review Snippet |
| Course, CourseLesson                              | Course                | ✅ Course         |
| PodcastEpisode                                    | PodcastEpisode        | —                 |
| Quote                                             | Quote                 | —                 |

### Event content (subtype generators)

| Subtype     | Schema `@type`   | Rich Result |
| ----------- | ---------------- | ----------- |
| Hackathon   | Hackathon        | ✅ Event    |
| Conference  | Event            | ✅ Event    |
| Webinar     | Event (Online)   | ✅ Event    |
| Meetup      | Event            | ✅ Event    |
| Workshop    | EducationalEvent | ✅ Event    |
| Competition | Event            | ✅ Event    |
| Bootcamp    | EducationalEvent | ✅ Event    |

---

## Priority Map Reference

`SCHEMA_PRIORITY` controls the order of nodes in a `@graph`. Lower = appears first.

```
Layer 1 — Identity & Navigation (1–9)
  WEBSITE    = 1   WebSite (always first — provides context for all)
  WEBPAGE    = 2   WebPage
  BREADCRUMB = 3   BreadcrumbList

Layer 2 — Primary Content (10–49)
  COURSE          = 10   Course
  CERTIFICATION   = 11
  HACKATHON       = 20
  CONFERENCE      = 21
  COMPETITION     = 22
  WORKSHOP        = 23
  WEBINAR         = 24
  MEETUP          = 25
  BOOTCAMP        = 26
  JOB_POSTING     = 30
  INTERNSHIP      = 31
  BLOG_POSTING    = 40   BlogPosting / TechArticle / ScholarlyArticle
  TECH_ARTICLE    = 41
  ARTICLE         = 42
  NOTES           = 43
  GIST            = 44
  QUOTE           = 45
  PROJECT         = 46
  RECIPE          = 47
  BOOK            = 48
  PODCAST         = 49

Layer 3 — Blog Sections (50–59)   ← Rich Result sub-schemas
  FAQ_SECTION        = 50   FAQPage
  HOWTO_SECTION      = 51   HowTo
  REVIEW_SECTION     = 52   Review
  CODE_SECTION       = 53   SoftwareSourceCode
  OPINION_SECTION    = 54   OpinionNewsArticle
  COMPARISON_SECTION = 55   ItemList
  CASE_STUDY_SECTION = 56   Article
  INTERVIEW_SECTION  = 57   Article

Layer 4 — People & Organizations (60–69)
  AUTHOR         = 60   Person
  SPEAKER        = 61
  MENTOR         = 62
  ORGANIZATION   = 63

Layer 5 — Lists (70–79)
  LEADERBOARD    = 70   ItemList
  SEARCH_RESULTS = 71
  COLLECTION     = 72

Layer 6 — Media (80–89)
  PRIMARY_IMAGE  = 80   ImageObject
  VIDEO          = 81   VideoObject
  AUDIO          = 82   AudioObject

Layer 7 — Resources & Tools (90–94)
  RESOURCE       = 90
  TOOL           = 91

Layer 8 — Engagement (95–99)    ← Least critical; always last
  COMMENTS       = 95
  REVIEW         = 96
  RATING         = 97
  INTERACTIONS   = 98
```

---

## Google Rich Results Eligibility

| Schema type                                | Rich Result category | Key requirements                                                   |
| ------------------------------------------ | -------------------- | ------------------------------------------------------------------ |
| BlogPosting, TechArticle, ScholarlyArticle | Article              | headline ≤ 110 chars, author, datePublished, image with dimensions |
| FAQPage                                    | FAQ                  | ≥ 2 Question nodes each with acceptedAnswer.text                   |
| HowTo                                      | How-to               | name, step[] with text on each step                                |
| Review                                     | Review Snippet       | reviewRating.ratingValue, itemReviewed, author                     |
| Event / Hackathon / Conference …           | Event                | name, startDate, location (or online mode)                         |
| JobPosting                                 | Job Posting          | title, description, datePosted, hiringOrganization.name            |
| Course                                     | Course               | name, description, provider.name                                   |
| VideoObject                                | Video                | name, description, thumbnailUrl, uploadDate                        |
| BreadcrumbList                             | Breadcrumb sitelinks | itemListElement[] with position                                    |

Run `pnpm validate` to check all schemas automatically, or call `validateForGoogleRichResults(schema)` at runtime.
