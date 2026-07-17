import { randomUUID } from 'crypto';
import type { BuildPostInput } from 'db-adapters';
import { BuildTimeSyncService, getDB } from 'db-adapters';
import { promises as fs } from 'fs';
import yaml from 'js-yaml';
import path from 'path';

const CONTENT_DIR = 'src/content/blog';

function parseFrontmatter(raw: string): Record<string, unknown> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return yaml.load(match[1]) as Record<string, unknown>;
}

async function run() {
  const currentBuildId = randomUUID();

  // 1. Initialize privileged server client connection
  const dbClient = getDB();
  const syncService = new BuildTimeSyncService(dbClient);

  // 2. Read renames (optional)
  let renames: { from: string; to: string }[] = [];
  try {
    const raw = await fs.readFile('src/data/renames.yaml', 'utf8');
    renames = yaml.load(raw) as { from: string; to: string }[];
  } catch {
    // no renames file — fine
  }

  // 3. Read post files and extract frontmatter (parallelized)
  const files = await fs.readdir(CONTENT_DIR);

  const contentPosts: BuildPostInput[] = await Promise.all(
    files
      .filter((file) => /\.(md|mdx)$/.test(file))
      .map(async (file) => {
        const slug = file.replace(/\.mdx?$/, '');
        const raw = await fs.readFile(path.join(CONTENT_DIR, file), 'utf8');
        const fm = parseFrontmatter(raw);

        return {
          slug,
          title: String(fm.title || slug),
          comments_state: fm.comments_state as BuildPostInput['comments_state'],
          interactions_state: fm.interactions_state as BuildPostInput['interactions_state'],
          highlights_notes: fm.highlights_notes as BuildPostInput['highlights_notes'],
        };
      }),
  );

  // 4. Fire the package-contained execution logic
  console.log(`🚀 Syncing ${contentPosts.length} posts (build ${currentBuildId})...`);
  await syncService.syncPostLifecycle({ currentBuildId, contentPosts, renames });
  console.log('✅ Done.');
}

run().catch((err) => {
  console.error('❌ Prebuild sync failed:', err);
  process.exit(1);
});
