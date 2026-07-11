import { defineMiddleware } from 'astro:middleware';
import { getDbAdapter } from '@vedify/db-adapters';

// Read database provider from environment variable (set at build time via config.yaml)
// This avoids node:fs which doesn't work on Cloudflare Workers
const activeProvider = import.meta.env.DATABASE_PROVIDER || 'mock';

export const databaseMiddleware = defineMiddleware((context, next) => {
  // Create adapter per-request so Supabase can use the user's access token
  // For mock provider, this is cheap (just returns the singleton)
  const accessToken = context.cookies.get('sb-access-token')?.value;
  context.locals.db = getDbAdapter(activeProvider, accessToken);
  return next();
});
