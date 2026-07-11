import { z } from 'zod';
import { imageSchema, videoSchema, faqSchema } from './nested';
import {
  difficultySchema,
  twitterCardSchema,
  seoPrioritySchema,
  statusSchema,
  intentSchema,
  topicSchema,
} from './enums';

// ISO 8601 date string (YYYY-MM-DD)
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD date format');

export const baseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(200),

  datePublished: isoDateString,
  dateModified: isoDateString,

  author: z.string().min(1),

  status: statusSchema.default('draft'),
  intent: intentSchema.optional(),
  topic: topicSchema.optional(),

  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),

  series: z.string().optional(),
  seriesPart: z.number().int().gte(0).optional(),
  seriesTitle: z.string().optional(),
  totalParts: z.number().int().gt(0).optional(),
  sequentialOnly: z.boolean().default(false),
  prerequisites: z.array(z.string()).default([]),

  image: imageSchema.optional(),
  video: videoSchema.optional(),

  readingTime: z.number().int().gt(0).optional(),
  difficulty: difficultySchema.optional(),
  totalTime: z.string().optional(),

  layout: z.string().optional(),
  canonical: z.string().optional(),
  noIndex: z.boolean().default(false),

  twitterCard: twitterCardSchema.optional(),
  twitterSite: z.string().optional(),
  twitterCreator: z.string().optional(),
  socialImage: z.string().url().optional(),
  socialTitle: z.string().max(100).optional(),
  socialDescription: z.string().max(200).optional(),

  aeoDirectAnswer: z.string().max(300).optional(),

  seoPriority: seoPrioritySchema.default('medium'),
  evergreen: z.boolean().default(false),
  featured: z.boolean().default(false),

  faqs: z.array(faqSchema).optional(),

  stickyTopicHeader: z.boolean().default(false),
  stickyH2Headers: z.boolean().default(false),

  adMode: z.enum(['none', 'single', 'repeat']).default('single'),
});

export type BaseFrontmatter = z.infer<typeof baseSchema>;
