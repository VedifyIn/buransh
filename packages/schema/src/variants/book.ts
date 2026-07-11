import { z } from 'zod';
import { baseSchema } from '../base';
import { bookMetadataSchema, ratingSchema } from '../nested';

export const bookSchema = baseSchema.extend({
  type: z.enum(['Book', 'BookReview']),
  book: bookMetadataSchema.optional(),
  rating: ratingSchema.optional(),
  reviewAspect: z.array(z.string()).optional(),
  reviewBody: z.string().optional(),
});

export type BookFrontmatter = z.infer<typeof bookSchema>;
