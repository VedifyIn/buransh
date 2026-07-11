import { z } from 'zod';
import { baseSchema } from '../base';

export const simpleContentSchema = baseSchema.extend({
  type: z.enum([
    'BlogPost',
    'Essay',
    'Opinion',
    'ShortStory',
    'Folktale',
    'Gist',
    'QuickNote',
    'SeriesOverview',
    'Devotional',
    'LegalPage',
    'AboutMe',
  ]),
});
