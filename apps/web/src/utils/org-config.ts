import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import type { OrganizationConfig, ResolvedAuthor } from '@vedify/schema';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CONFIG_PATH = resolve(__dirname, '../data/config.yaml');

let cachedOrg: OrganizationConfig | undefined;

export function getOrgConfig(): OrganizationConfig {
  if (cachedOrg) return cachedOrg;
  try {
    const raw = load(readFileSync(CONFIG_PATH, 'utf-8')) as Record<string, unknown>;
    cachedOrg = (raw.organization as OrganizationConfig) ?? {};
  } catch {
    cachedOrg = {};
  }
  return cachedOrg;
}

export function buildResolvedAuthor(name: string): ResolvedAuthor {
  return { name };
}
