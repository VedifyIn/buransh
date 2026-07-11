declare module '*.yaml' {
  const value: SiteConfig;
  export default value;
}

interface SiteConfig {
  site: string;
  trailingSlash: 'always' | 'never' | 'ignore';
  server: 'cloudflare' | 'vercel' | 'static';
  databaseProvider: 'mock' | 'supabase';

  pwa: {
    registerType: 'prompt' | 'autoUpdate';
    manifest: {
      name: string;
      short_name: string;
      description: string;
      theme_color: string;
      background_color: string;
      display: 'standalone' | 'fullscreen' | 'minimal-ui';
      icons: Array<{
        src: string;
        sizes: string;
        type: string;
      }>;
    };
    workbox: {
      globPatterns: string[];
      navigateFallback: string;
    };
  };

  partytown: {
    forward: string[];
  };

  markdown: {
    shikiConfig: {
      themes: {
        light: string;
        dark: string;
      };
    };
  };

  defaultFont: string;
  fonts: FontConfig[];
}

interface FontConfig {
  name: string;
  cssVariable: string;
  fallbacks: string[];
  variants: Array<{
    src: string[];
    weight: number;
    style: 'normal' | 'italic';
    display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  }>;
}
