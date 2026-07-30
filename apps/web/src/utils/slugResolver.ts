export interface SlugEntry {
  slug: string;
  id: string;
  collection: string;
}

export function resolveSlugFromId(id: string): string {
  let slug = id.replace(/\.(md|mdx)$/, '');
  slug = slug.replace(/^\d{4}\/\d{2}-[a-z]{3}\//, '');
  const parts = slug.split('/');
  return parts[parts.length - 1];
}

export function detectSlugCollisions(entries: SlugEntry[]): void {
  const slugMap = new Map<string, SlugEntry[]>();

  for (const entry of entries) {
    const existing = slugMap.get(entry.slug) || [];
    existing.push(entry);
    slugMap.set(entry.slug, existing);
  }

  const collisions = Array.from(slugMap.entries()).filter(([, entries]) => entries.length > 1);

  if (collisions.length > 0) {
    const messages = collisions.map(([slug, entries]) => {
      const sources = entries.map((e) => `  - ${e.collection}: ${e.id}`).join('\n');
      return `Slug collision: "${slug}" resolves to multiple entries:\n${sources}`;
    });
    throw new Error(
      `Slug collision detected!\n\n${messages.join('\n\n')}\n\nAll content slugs must be unique across all collections.`,
    );
  }
}

export function resolveRedirect(slug: string, redirects: Record<string, string>): string | null {
  return redirects[slug] || null;
}
