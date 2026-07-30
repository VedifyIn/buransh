import { load as loadYaml } from 'js-yaml';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectSlugCollisions, resolveSlugFromId } from '../utils/slugResolver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '..', 'content');

function parseFrontmatter(filePath: string): Record<string, unknown> | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const match = /^---\n([\s\S]*?)\n---/.exec(content);
    if (!match) return null;
    return loadYaml(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default function slugCollisionIntegration() {
  return {
    name: 'slug-collision',
    hooks: {
      'astro:build:done': async ({
        logger,
      }: {
        logger: {
          info: (msg: string) => void;
          warn: (msg: string) => void;
          error: (msg: string) => void;
        };
      }) => {
        if (!existsSync(CONTENT_DIR)) {
          logger.warn('No content directory found, skipping slug collision check.');
          return;
        }

        const entries: { slug: string; id: string; collection: string }[] = [];

        function walk(d: string, collection: string) {
          for (const entry of readdirSync(d, { withFileTypes: true })) {
            const full = resolve(d, entry.name);
            if (entry.isDirectory()) {
              if (!entry.name.startsWith('.')) walk(full, collection || entry.name);
            } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
              const fm = parseFrontmatter(full);
              const rawSlug = typeof fm?.slug === 'string' ? fm.slug : undefined;
              const id = entry.name.replace(/\.(md|mdx)$/, '');
              entries.push({
                slug: rawSlug || resolveSlugFromId(id),
                id: `${collection}/${id}`,
                collection,
              });
            }
          }
        }

        walk(CONTENT_DIR, '');

        if (entries.length === 0) {
          logger.info('No content entries found for slug collision check.');
          return;
        }

        try {
          detectSlugCollisions(entries);
          logger.info(`Slug collision check passed — ${entries.length} entries checked.`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logger.error(`Slug collision check failed: ${message}`);
          throw error;
        }
      },
    },
  };
}
