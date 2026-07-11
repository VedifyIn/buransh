import { z } from 'zod';
import { baseSchema } from '../base';

export const researchSchema = baseSchema.extend({
  type: z.enum(['ResearchPaper', 'Patent']),
  citation: z.string().optional(),
  journal: z.string().optional(),
  doi: z.string().optional(),
  arxivId: z.string().optional(),
  patentNumber: z.string().optional(),
  applicant: z.string().optional(),
  issueDate: z.string().optional(),
});

export type ResearchFrontmatter = z.infer<typeof researchSchema>;
