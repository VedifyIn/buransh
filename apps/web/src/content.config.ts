import { contentSchema } from '@vedify/schema';
import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';

const content = defineCollection({
  loader: glob({ base: './src/content', pattern: '**/*.{md,mdx}' }),
  schema: contentSchema,
});

export const collections = {
  content,
};
