// @ts-check
//
// =============================================================================
// Astro Configuration
// =============================================================================
//
// Central build configuration for the Buransh Astro theme.
//
// Architecture overview:
//   1. YAML config (src/data/config.yaml) is the single source of truth
//   2. Vite virtual modules expose config data to components at build time
//      without node:fs (required for Cloudflare Workers compatibility)
//   3. Font body injection maps the default font to --font-body via Tailwind v4
//   4. i18n reads per-locale YAML files and exports flattened translation keys
//   5. Deployment adapter is resolved dynamically from config.server
//

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
//
// All site-wide values live in src/data/config.yaml. This file is read once
// at build time and injected into virtual modules for component consumption.
// Changing any value here triggers a full rebuild.
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const config = yaml.load(readFileSync(resolve(__dirname, 'src/data/config.yaml'), 'utf8'));

// ---------------------------------------------------------------------------
// Font body injection (Vite plugin: font-body-css)
//
// Maps the default font from config.yaml to the --font-body CSS variable.
// This Vite plugin injects `--font-body: var(--font-xxx);` inside the
// existing `@theme inline` block in global.css, keeping all Tailwind v4
// theme variables in one place.
//
// Flow: config.yaml → defaultFont → defaultFontCssVar → @theme inline → body font
// ---------------------------------------------------------------------------
const defaultFontCssVar = `--font-${config.defaultFont.toLowerCase()}`;

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
// Virtual module: virtual:site-fonts (Vite plugin: site-fonts)
//
// Exports font metadata to Astro components at build time without node:fs.
// Components import { fonts, defaultFontCssVar } from 'virtual:site-fonts'.
//
// This is necessary because Cloudflare Workers don't have access to node:fs,
// but Astro components' frontmatter gets bundled into prerender chunks that
// run in the Workers runtime. Virtual modules are resolved at build time and
// don't require filesystem access at runtime.
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

// ---------------------------------------------------------------------------
// Virtual module: virtual:i18n (Vite plugin: virtual-i18n)
//
// Reads i18n YAML files at build time and exports a merged translations map.
//
// Directory structure:
//   src/data/i18n/
//   ├── header.yaml          ← English (default locale)
//   └── hi/
//       └── header.yaml      ← Hindi
//
// Each YAML file is a namespace (e.g., "header"). Nested keys are flattened
// to dot notation: { nav: { home: "Home" } } → { "nav.home": "Home" }
//
// Components import { ui, defaultLocale } from 'virtual:i18n'.
// Then use useTranslations(locale) from src/utils/i18n.ts for type-safe access.
// ---------------------------------------------------------------------------
const i18nDir = resolve(__dirname, 'src/data/i18n');

function loadYamlIfExists(path) {
    try {
        return yaml.load(readFileSync(path, 'utf8')) || {};
    } catch {
        return {};
    }
}

const i18nModule = {
    name: 'virtual-i18n',
    resolveId(id) {
        if (id === 'virtual:i18n') return '\0virtual:i18n';
    },
    load(id) {
        if (id === '\0virtual:i18n') {
            const defaultLocale = 'en';
            const locales = ['en', 'hi'];

            // Each YAML file in the i18n directory is a namespace.
            // Add new namespaces here as you create more YAML files.
            const defaultFiles = ['header.yaml'];
            const ui = {};

            for (const locale of locales) {
                ui[locale] = {};
                for (const file of defaultFiles) {
                    // Default locale reads from root, others from their subdirectory
                    const basePath = locale === defaultLocale
                        ? resolve(i18nDir, file)
                        : resolve(i18nDir, locale, file);
                    const data = loadYamlIfExists(basePath);

                    // Flatten nested keys: { nav: { home: "..." } } → { "nav.home": "..." }
                    function flatten(obj, prefix = '') {
                        for (const [k, v] of Object.entries(obj)) {
                            const key = prefix ? `${prefix}.${k}` : k;
                            if (typeof v === 'object' && v !== null) {
                                flatten(v, key);
                            } else {
                                ui[locale][key] = v;
                            }
                        }
                    }
                    flatten(data);
                }
            }

            return `export const defaultLocale = ${JSON.stringify(defaultLocale)};\nexport const ui = ${JSON.stringify(ui)};`;
        }
    },
};

// ---------------------------------------------------------------------------
// Resolve deployment adapter from config.server
//
//   "cloudflare" → @astrojs/cloudflare (Workers / Pages)
//   "vercel"     → @astrojs/vercel     (Edge or Node runtime)
//   "static"     → no adapter          (pure static export)
//
// The adapter is resolved dynamically based on the `server` field in
// config.yaml, so you can switch deployment targets by changing one value.
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

// =============================================================================
// Astro Config
// =============================================================================

export default defineConfig({
    // Production URL — used for sitemap, canonical links, and RSS feed
    site: config.site,

    // Deployment adapter — resolved from config.server (cloudflare | vercel | static)
    ...(adapter ? { adapter } : {}),

    // ---------------------------------------------------------------------------
    // Vite plugins — run in order, transform source at build time
    // ---------------------------------------------------------------------------
    vite: {
        plugins: [
            tailwindcss(),    // Tailwind CSS v4 Vite integration
            fontBodyPlugin,   // Injects --font-body from config.yaml defaultFont
            siteFontsModule,  // Exports font config via virtual:site-fonts
            i18nModule,       // Exports translations via virtual:i18n
        ],
        css: {
            transformer: 'lightningcss',
            cssMinify: 'esbuild',
        },
        rolldownOptions: {
            external: [
                // @supabase/supabase-js and its sub-packages import
                // tslib, which Rolldown can't resolve in pnpm's strict
                // node_modules. These are server-side only — on a static
                // site they're never executed in the browser, so we
                // externalize them instead of bundling.
                '@supabase/supabase-js',
                /@supabase\//,
            ],
        },
    },

    // ---------------------------------------------------------------------------
    // Astro integrations — extend build pipeline
    // ---------------------------------------------------------------------------
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

    // ---------------------------------------------------------------------------
    // Astro Font API — each entry becomes a CSS variable and @font-face rule.
    // Font files are fetched, optimized, and cached at build time.
    // Only the default font is preloaded in BaseHead.astro via <Font preload />.
    // ---------------------------------------------------------------------------
    fonts: config.fonts.map((font) => ({
        provider: fontProviders.local(),
        name: font.name,
        cssVariable: font.cssVariable,
        fallbacks: font.fallbacks,
        options: {
            variants: font.variants,
        },
    })),

    // Markdown / Shiki syntax highlighting config
    markdown: config.markdown,

    // URL trailing slash behavior: "always" | "never" | "ignore"
    trailingSlash: config.trailingSlash,

    // ---------------------------------------------------------------------------
    // i18n — Astro's built-in internationalization
    //
    // "en" is the default locale (no prefix): /
    // "hi" uses the /hi/ prefix: /hi/, /hi/about, /hi/contact
    // Missing pages fall back to the English version via rewrite.
    // Translation strings live in src/data/i18n/ YAML files.
    // ---------------------------------------------------------------------------
    i18n: {
        defaultLocale: 'en',
        locales: ['en', 'hi'],
        routing: {
            prefixDefaultLocale: false,  // English at /, not /en/
            fallbackType: 'rewrite',    // Silent rewrite to English if locale page is missing
        },
    },
});
