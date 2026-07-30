import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { load as loadYaml } from 'js-yaml';

const AEO_PREVIEW_LIMIT = 10;
const TAG_DISPLAY_LIMIT = 30;

interface ContentEntry {
  title: string;
  id: string;
  type: string;
  description: string;
  datePublished: string;
  tags: string[];
  categories: string[];
  aeoDirectAnswer?: string;
}

function parseFrontmatter(
  filePath: string,
): { data: Record<string, unknown>; body: string } | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(content);
    if (!match) return null;
    const data = loadYaml(match[1]) as Record<string, unknown>;
    return { data, body: match[2] };
  } catch {
    return null;
  }
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function firstOf(...fields: string[]): (data: Record<string, unknown>) => string {
  return (data) => {
    for (const f of fields) {
      const v = data[f];
      if (typeof v === 'string' && v) return v;
    }
    return '';
  };
}

function firstOfArray(...fields: string[]): (data: Record<string, unknown>) => string[] {
  return (data) => {
    for (const f of fields) {
      const v = data[f];
      if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
    }
    return [];
  };
}

const getTitle = firstOf('title', 'name');
const getDescription = firstOf('description', 'summary', 'excerpt');
const getDate = firstOf('datePublished', 'pubDate', 'publishedAt', 'date');
const getId = firstOf('id', 'slug', 'customId');
const getTags = firstOfArray('tags', 'keywords', 'topics');
const getCategories = firstOfArray('categories', 'category', 'collection');

function collectContent(dir: string): ContentEntry[] {
  const entries: ContentEntry[] = [];

  function walk(d: string, relativePath = '') {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = resolve(d, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.'))
          walk(full, relativePath ? `${relativePath}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        const parsed = parseFrontmatter(full);
        if (!parsed) continue;
        const { data } = parsed;
        const stem = entry.name.replace(/\.(md|mdx)$/, '');
        const collectionName = relativePath.split('/')[0] || 'uncategorized';
        entries.push({
          title: getTitle(data) || stem,
          id: getId(data) || stem,
          type: toString(data.type, collectionName),
          description: getDescription(data),
          datePublished: getDate(data),
          tags: getTags(data),
          categories: [...new Set([...getCategories(data), collectionName])],
          aeoDirectAnswer:
            typeof data.aeoDirectAnswer === 'string' ? data.aeoDirectAnswer : undefined,
        });
      }
    }
  }

  walk(dir);
  return entries;
}

function groupByCategory(entries: ContentEntry[]): Record<string, ContentEntry[]> {
  const grouped: Record<string, ContentEntry[]> = {};
  for (const entry of entries) {
    const cat = entry.categories[0] ?? 'Uncategorized';
    (grouped[cat] ??= []).push(entry);
  }
  return grouped;
}

function generateLlmTxt(entries: ContentEntry[], baseUrl: string, siteName: string): string {
  const lines: string[] = [
    `# Site: ${siteName}`,
    `# URL: ${baseUrl}`,
    `# Description: Content collections from ${siteName}`,
    `# Updated: ${new Date().toISOString().split('T')[0]}`,
    '',
  ];

  const grouped = groupByCategory(entries);

  lines.push('## Content by Category', '');
  for (const [category, items] of Object.entries(grouped)) {
    lines.push(`### ${category}`);
    items
      .slice()
      .sort((a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime())
      .forEach((item) => {
        const url = item.id.startsWith('http') ? item.id : `${baseUrl}/${item.id}`;
        lines.push(
          `- [${item.title}](${url})${item.description ? ` - ${item.description}` : ''}${item.datePublished ? ` (${item.datePublished})` : ''}`,
        );
      });
    lines.push('');
  }

  const aeoAnswers = entries.filter((e) => e.aeoDirectAnswer);
  if (aeoAnswers.length > 0) {
    lines.push('## AEO Direct Answers', '');
    for (const entry of aeoAnswers.slice(0, AEO_PREVIEW_LIMIT)) {
      lines.push(`### ${entry.title}`, `${entry.aeoDirectAnswer}`, '');
    }
  }

  lines.push(
    '## Statistics',
    '| Category | Count |',
    '|----------|-------|',
    ...Object.entries(grouped).map(([cat, items]) => `| ${cat} | ${items.length} |`),
    '',
  );

  const allTags = [...new Set(entries.flatMap((e) => e.tags))];
  if (allTags.length > 0) {
    lines.push(
      '## Topic Tags (For RAG)',
      allTags
        .slice(0, TAG_DISPLAY_LIMIT)
        .map((t) => `#${t.replace(/\s+/g, '')}`)
        .join(' '),
      '',
    );
  }

  return lines.join('\n');
}

function generateFullLlmTxt(contentDir: string, baseUrl: string): string {
  const lines: string[] = [
    `# Full Content Archive`,
    `# Generated: ${new Date().toISOString()}`,
    '',
  ];

  function walk(d: string) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = resolve(d, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) walk(full);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        const parsed = parseFrontmatter(full);
        if (!parsed) continue;
        const stem = entry.name.replace(/\.(md|mdx)$/, '');
        const id = toString(parsed.data.id, stem);
        const url = id.startsWith('http') ? id : `${baseUrl}/${id}`;
        lines.push(
          `## ${toString(parsed.data.title, entry.name)}`,
          `URL: ${url}`,
          `Type: ${toString(parsed.data.type, 'content')}`,
          '',
          parsed.body.trim(),
          '',
          '---',
          '',
        );
      }
    }
  }

  walk(contentDir);
  return lines.join('\n');
}

export function generateLlmContent(
  contentDir: string,
  baseUrl: string,
  siteName: string,
): { llm: string; llmFull: string } {
  const entries = collectContent(contentDir);
  return {
    llm: generateLlmTxt(entries, baseUrl, siteName),
    llmFull: generateFullLlmTxt(contentDir, baseUrl),
  };
}

export function getEntryCount(contentDir: string): number {
  if (!existsSync(contentDir)) return 0;
  return collectContent(contentDir).length;
}
