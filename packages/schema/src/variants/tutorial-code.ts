import { z } from 'zod';
import { baseSchema } from '../base';

export const tutorialCodeSchema = baseSchema.extend({
  type: z.enum(['Tutorial', 'CodeSnippet']),
  programmingLanguage: z.array(z.string()).optional(),
  codeRepository: z.string().url().optional(),
  dependencies: z.array(z.string()).optional(),
  codeSnippet: z.string().optional(),
});

export type TutorialCodeFrontmatter = z.infer<typeof tutorialCodeSchema>;
