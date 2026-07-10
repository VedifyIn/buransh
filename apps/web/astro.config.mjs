// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import pwa from '@vite-pwa/astro';
import partytown from '@astrojs/partytown';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// Load site config from YAML
// All site-wide values (URL, PWA, fonts, etc.) live in one place.
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const config = yaml.load(readFileSync(resolve(__dirname, 'src/data/config.yaml'), 'utf8'));

// ---------------------------------------------------------------------------
// Font body injection
//
// The `defaultFont` in config.yaml picks which font variable to map to
// `--font-body`. This Vite plugin injects `--font-body: var(--font-xxx);`
// inside the existing `@theme` block in global.css, keeping all Tailwind
// theme variables in one place.
// ---------------------------------------------------------------------------
const defaultFontCssVar = `--font-${config.defaultFont.toLowerCase()}`;

// ---------------------------------------------------------------------------
// Virtual module: virtual:site-fonts
//
// Exports font config to Astro components at build time without node:fs.
// Components import { fonts, defaultFontCssVar } from 'virtual:site-fonts'.
// ---------------------------------------------------------------------------
const siteFontsModule = {
    name: 'site-fonts',
    resolveId(id) {
        if (id === 'virtual:site-fonts') return '\0virtual:site-fonts';
    },
    load(id) {
        if (id === '\0virtual:site-fonts') {
            const fonts = config.fonts.map((f) => ({
                name: f.name,
                cssVariable: f.cssVariable,
                fallbacks: f.fallbacks,
            }));
            return `export const fonts = ${JSON.stringify(fonts)};\nexport const defaultFontCssVar = ${JSON.stringify(defaultFontCssVar)};`;
        }
    },
};

const fontBodyPlugin = {
    name: 'font-body-css',
    enforce: 'pre',
    transform(code, id) {
        if (id.includes('global.css')) {
            if (code.includes('@theme inline')) {
                return {
                    code: code.replace('@theme inline {', `@theme inline {\n\t--font-body: var(${defaultFontCssVar});`),
                    map: null,
                };
            }
            if (code.includes('@theme')) {
                return {
                    code: code.replace('@theme {', `@theme {\n\t--font-body: var(${defaultFontCssVar});`),
                    map: null,
                };
            }
            return {
                code: `@theme inline {\n\t--font-body: var(${defaultFontCssVar});\n}\n${code}`,
                map: null,
            };
        }
    },
};

// ---------------------------------------------------------------------------
// Resolve deployment adapter from config.server
//
//   "cloudflare" → @astrojs/cloudflare (Workers / Pages)
//   "vercel"     → @astrojs/vercel     (Edge or Node runtime)
//   "static"     → no adapter          (pure static export)
// ---------------------------------------------------------------------------
async function getAdapter(target) {
    switch (target) {
        case 'cloudflare': {
            const mod = await import('@astrojs/cloudflare');
            return mod.default();
        }
        case 'vercel': {
            const mod = await import('@astrojs/vercel');
            return mod.default();
        }
        default:
            return undefined;
    }
}

const adapter = await getAdapter(config.server);

// https://astro.build/config
export default defineConfig({
    // Canonical site URL (used for sitemap, canonical links, RSS)
    site: config.site,

    // Deployment adapter — resolved from config.server (cloudflare | vercel | static)
    ...(adapter ? { adapter } : {}),

    vite: {
        plugins: [
            tailwindcss(),    // Tailwind CSS v4 Vite integration
            fontBodyPlugin,   // Injects --font-body from config.yaml defaultFont
            siteFontsModule,  // Exports font config via virtual:site-fonts
        ],
    },

    integrations: [
        mdx(),               // MDX support for blog posts
        sitemap(),           // Auto-generate sitemap.xml
        partytown({ config: { forward: config.partytown.forward } }),  // Offload GTM to web worker
        pwa({
            registerType: config.pwa.registerType,
            manifest: config.pwa.manifest,
            workbox: config.pwa.workbox,
        }),
    ],

    // Astro Font API — each entry becomes a CSS variable and @font-face rule.
    // Font files are fetched, optimized, and cached at build time.
    // Only the default font is preloaded in BaseHead.astro via <Font preload />.
    fonts: config.fonts.map((font) => ({
        provider: fontProviders.local(),
        name: font.name,
        cssVariable: font.cssVariable,
        fallbacks: font.fallbacks,
        options: {
            variants: font.variants,
        },
    })),

    markdown: config.markdown,
    trailingSlash: config.trailingSlash,
});
