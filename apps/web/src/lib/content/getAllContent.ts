import { getCollection, type CollectionEntry } from 'astro:content';

export type ContentEntry = CollectionEntry<'content'>;

const TYPE_PREFIXES = [
  'essay', 'book', 'book-review', 'recipe', 'tutorial',
  'research-paper', 'patent', 'podcast', 'quote', 'course',
  'course-lesson', 'blog', 'event', 'conference', 'webinar', 'workshop',
] as const;

export type ContentTypePrefix = (typeof TYPE_PREFIXES)[number];

function getTypePrefix(id: string): ContentTypePrefix {
  return id.split('/')[0] as ContentTypePrefix;
}

function sortByDate(entries: ContentEntry[]): ContentEntry[] {
  return [...entries].sort((a, b) => {
    const dateA = a.data.datePublished ? new Date(a.data.datePublished).getTime() : 0;
    const dateB = b.data.datePublished ? new Date(b.data.datePublished).getTime() : 0;
    return dateB - dateA;
  });
}

export async function getAllContent(): Promise<ContentEntry[]> {
  const entries = await getCollection('content');
  return sortByDate(entries);
}

export async function getContentCounts(): Promise<Record<string, number>> {
  const all = await getCollection('content');
  const counts: Record<string, number> = {};
  for (const entry of all) {
    const prefix = getTypePrefix(entry.id);
    counts[prefix] = (counts[prefix] ?? 0) + 1;
  }
  return counts;
}

export async function getFirstOfEachType(): Promise<Partial<Record<ContentTypePrefix, ContentEntry>>> {
  const all = await getCollection('content');
  const grouped: Record<string, ContentEntry[]> = {};
  for (const entry of all) {
    const prefix = getTypePrefix(entry.id);
    if (!grouped[prefix]) grouped[prefix] = [];
    grouped[prefix].push(entry);
  }
  const result: Partial<Record<ContentTypePrefix, ContentEntry>> = {};
  for (const [prefix, entries] of Object.entries(grouped)) {
    const sorted = sortByDate(entries);
    result[prefix as ContentTypePrefix] = sorted[0];
  }
  return result;
}

export async function getLatestContent(limit: number = 10): Promise<ContentEntry[]> {
  const all = await getAllContent();
  return all.slice(0, limit);
}
