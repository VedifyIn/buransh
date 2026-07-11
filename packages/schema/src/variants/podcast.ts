import { z } from 'zod';
import { baseSchema } from '../base';
import { mediaObjectSchema } from '../nested';

export const podcastSchema = baseSchema.extend({
  type: z.literal('PodcastEpisode'),
  media: mediaObjectSchema.optional(),
  episodeNumber: z.number().int().gt(0).optional(),
  seasonNumber: z.number().int().gt(0).optional(),
  podcastSeries: z.string().optional(),
});

export type PodcastFrontmatter = z.infer<typeof podcastSchema>;
