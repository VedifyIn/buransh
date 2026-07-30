import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';

export interface AuthorStat {
  label: string;
  value: string | number;
}

export interface Author {
  slug: string;
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  stats?: AuthorStat[];
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const AUTHORS_PATH = resolve(__dirname, '../data/authors.yaml');

let cachedAuthors: Author[] | undefined;

function loadAuthors(): Author[] {
  if (cachedAuthors) return cachedAuthors;
  try {
    const raw = load(readFileSync(AUTHORS_PATH, 'utf-8')) as { authors?: Author[] };
    cachedAuthors = raw.authors ?? [];
  } catch {
    cachedAuthors = [];
  }
  return cachedAuthors;
}

export function getAuthor(slug: string): Author | undefined {
  return loadAuthors().find((a) => a.slug === slug);
}

export function getAllAuthors(): Author[] {
  return loadAuthors();
}
