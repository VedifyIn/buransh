import { z } from 'zod';

export const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().min(1),
  width: z.number().int().gt(0).optional(),
  height: z.number().int().gt(0).optional(),
});
export type Image = z.infer<typeof imageSchema>;

export const videoSchema = z.object({
  url: z.string().url(),
  thumbnail: z.string().url(),
  duration: z.string().optional(),
  transcript: z.string().optional(),
  embedUrl: z.string().url().optional(),
  uploadDate: z.string().optional(),
});
export type Video = z.infer<typeof videoSchema>;

export const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});
export type Faq = z.infer<typeof faqSchema>;

export const ingredientSchema = z.object({
  name: z.string().min(1),
  amount: z.string().min(1),
  preparation: z.string().optional(),
});
export type Ingredient = z.infer<typeof ingredientSchema>;

export const instructionSchema = z.object({
  text: z.string().min(1),
  image: z.string().optional(),
});
export type Instruction = z.infer<typeof instructionSchema>;

export const nutritionSchema = z.object({
  calories: z.string().optional(),
  protein: z.string().optional(),
  carbs: z.string().optional(),
  fat: z.string().optional(),
});
export type Nutrition = z.infer<typeof nutritionSchema>;

export const bookMetadataSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  pages: z.number().int().gt(0).optional(),
  genre: z.array(z.string()).optional(),
  publicationDate: z.string().optional(),
});
export type BookMetadata = z.infer<typeof bookMetadataSchema>;

export const ratingSchema = z.object({
  value: z.number().min(0).max(5),
  bestRating: z.number().default(5),
  worstRating: z.number().default(1),
});
export type Rating = z.infer<typeof ratingSchema>;

export const mediaObjectSchema = z.object({
  type: z.enum(['audio', 'video']),
  url: z.string().url(),
  duration: z.string().optional(),
  transcript: z.string().optional(),
});
export type MediaObject = z.infer<typeof mediaObjectSchema>;

export const quoteObjectSchema = z.object({
  text: z.string().min(1),
  attributedTo: z.object({
    name: z.string().min(1),
    url: z.string().optional(),
    sameAs: z.array(z.string()).optional(),
  }),
  context: z.string().optional(),
});
export type QuoteObject = z.infer<typeof quoteObjectSchema>;

export const providerSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional(),
});
export type Provider = z.infer<typeof providerSchema>;
