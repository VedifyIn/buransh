/**
 * Comparison section schema generator (ItemList of compared items)
 */

export interface ComparisonItem {
  name: string;
  description?: string;
  url?: string;
  rating?: number;
  pros?: string[];
  cons?: string[];
}

export interface ComparisonSectionData {
  name: string;
  description?: string;
  items: ComparisonItem[];
}

export interface ComparisonSectionOptions {
  id?: string;
}

/**
 * Generate an ItemList schema representing a comparison table/section.
 */
export function generateComparisonSection(
  data: ComparisonSectionData,
  options: ComparisonSectionOptions = {},
) {
  return {
    '@type': 'ItemList' as const,
    ...(options.id ? { '@id': options.id } : {}),
    name: data.name,
    description: data.description,
    numberOfItems: data.items.length,
    itemListElement: data.items.map((item, i) => ({
      '@type': 'ListItem' as const,
      position: i + 1,
      name: item.name,
      description: item.description,
      url: item.url,
    })),
  };
}
