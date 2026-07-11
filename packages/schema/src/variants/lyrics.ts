import { z } from 'zod';
import { baseSchema } from '../base';
import { mediaObjectSchema } from '../nested';

export const lyricsSchema = baseSchema.extend({
  type: z.literal('Lyrics'),
  lyricist: z.string().min(1).optional(),
  composer: z.string().min(1).optional(),
  genre: z.array(z.string()).default([]),
  album: z.string().optional(),
  trackNumber: z.number().int().gt(0).optional(),
  iswc: z.string().optional(),
  inLanguage: z.string().default('en'),
  media: mediaObjectSchema.optional(),
  publisher: z.string().optional(),
  recordingLabel: z.string().optional(),
  iswcTitle: z.string().optional(),
});

export type LyricsFrontmatter = z.infer<typeof lyricsSchema>;
