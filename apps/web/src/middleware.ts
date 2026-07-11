import { sequence } from 'astro:middleware';
import { databaseMiddleware } from './lib/middleware/database';

// Astro executes these functions sequentially from left to right!
// 1. databaseMiddleware injects context.locals.db
// 2. Your final API routing endpoints or .astro page run
export const onRequest = sequence(databaseMiddleware);
