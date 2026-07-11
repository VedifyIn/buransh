import { z } from 'zod';
import { baseSchema } from '../base';
import { providerSchema } from '../nested';

export const courseSchema = baseSchema.extend({
  type: z.enum(['Course', 'CourseLesson']),
  educationalLevel: z.string().optional(),
  timeRequired: z.string().optional(),
  numberOfLessons: z.number().int().gt(0).optional(),
  provider: providerSchema.optional(),
  courseCode: z.string().optional(),
  hasRepo: z.boolean().default(false),
  repoUrl: z.string().url().optional(),
  startBranch: z.string().optional(),
  finishedBranch: z.string().optional(),
});
