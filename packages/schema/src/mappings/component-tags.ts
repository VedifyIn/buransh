export const COMPONENT_TAG_MAP = {
  paragraph: { tag: 'p' },
  heading: { h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6' },
  list: { unordered: 'ul', ordered: 'ol', item: 'li' },
  quote: { block: 'blockquote', source: 'cite' },
  figure: { wrapper: 'figure', image: 'img', caption: 'figcaption' },
  code: { block: 'pre', inline: 'code' },
  table: { wrapper: 'table', head: 'thead', body: 'tbody', row: 'tr', header: 'th', cell: 'td' },
  details: { wrapper: 'details', summary: 'summary' },
  media: { wrapper: 'figure', caption: 'figcaption' },
  horizontalRule: { tag: 'hr' },
  callout: { tag: 'aside' },
} as const;

export type ComponentType = keyof typeof COMPONENT_TAG_MAP;
export type ComponentTags = (typeof COMPONENT_TAG_MAP)[ComponentType];

export function getComponentTag(component: ComponentType, variant?: string): string | undefined {
  const entry = COMPONENT_TAG_MAP[component];
  if (!entry) return undefined;
  if ('tag' in entry) return entry.tag;
  if (variant && typeof entry === 'object') {
    const map = entry as Record<string, string>;
    return map[variant];
  }
  return undefined;
}
