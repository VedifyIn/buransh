import { defineMiddleware } from 'astro:middleware';
import { getDbAdapter } from '@vedify/db-adapters';
import fs from 'node:fs';
import path from 'node:path';

// 1. Read your config.yaml file safely on server startup
const yamlPath = path.resolve(process.cwd(), 'src/data/config.yaml');
const yamlString = fs.readFileSync(yamlPath, 'utf8');

// Parse out your database tracking variable via a quick regex match
const activeProvider =
  yamlString.match(/^databaseProvider:\s*["']?([^"'\s]+)["']?/m)?.[1] || 'mock';

// 2. Initialize your plug-and-play database package
const dbInstance = getDbAdapter(activeProvider);

// 3. This runs automatically on every single incoming API or page request
export const onRequest = defineMiddleware((context, next) => {
  context.locals.db = dbInstance;
  return next();
});
