import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { generateLlmContent, getEntryCount } from '../utils/generate-llm-content';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadConfig() {
  const configPath = resolve(__dirname, '..', 'data', 'config.yaml');
  if (!existsSync(configPath)) {
    return { site: 'https://vedify.in', name: 'Vedify' };
  }
  const config = yaml.load(readFileSync(configPath, 'utf8')) as Record<string, unknown>;
  return { site: String(config.site || 'https://vedify.in'), name: 'Vedify' };
}

export default function llmTxtIntegration() {
  return {
    name: 'llm-txt',
    hooks: {
      'astro:build:done': async ({
        dir,
        logger,
      }: {
        dir: { pathname: string };
        logger: { info: (msg: string) => void; warn: (msg: string) => void };
      }) => {
        const contentDir = resolve(__dirname, '..', 'content');
        if (!existsSync(contentDir)) {
          logger.warn('No content directory found, skipping llm.txt generation.');
          return;
        }

        const { site, name } = loadConfig();
        mkdirSync(dir.pathname, { recursive: true });

        const { llm, llmFull } = generateLlmContent(contentDir, site, name);
        const count = getEntryCount(contentDir);

        writeFileSync(resolve(dir.pathname, 'llm.txt'), llm, 'utf-8');
        logger.info(`llm.txt generated — ${count} entries`);

        writeFileSync(resolve(dir.pathname, 'llm-full.txt'), llmFull, 'utf-8');
        logger.info(`llm-full.txt generated — full content archive`);
      },
    },
  };
}
