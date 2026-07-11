/**
 * HowTo section schema generator
 * Google Rich Result: https://developers.google.com/search/docs/appearance/structured-data/how-to
 */

export interface HowToStep {
  name?: string;
  text: string;
  image?: string;
  url?: string;
}

export interface HowToSectionData {
  name: string;
  description?: string;
  totalTime?: string; // ISO 8601 duration e.g. "PT30M"
  estimatedCost?: { currency: string; value: string };
  supply?: string[];
  tool?: string[];
  steps: HowToStep[];
}

export interface HowToSectionOptions {
  id?: string;
}

/**
 * Generate a HowTo schema for tutorial/guide content.
 */
export function generateHowToSection(data: HowToSectionData, options: HowToSectionOptions = {}) {
  return {
    '@type': 'HowTo' as const,
    ...(options.id ? { '@id': options.id } : {}),
    name: data.name,
    description: data.description,
    totalTime: data.totalTime,
    estimatedCost: data.estimatedCost
      ? {
          '@type': 'MonetaryAmount' as const,
          currency: data.estimatedCost.currency,
          value: data.estimatedCost.value,
        }
      : undefined,
    supply: data.supply?.map((s) => ({ '@type': 'HowToSupply' as const, name: s })),
    tool: data.tool?.map((t) => ({ '@type': 'HowToTool' as const, name: t })),
    step: data.steps.map((step, i) => ({
      '@type': 'HowToStep' as const,
      position: i + 1,
      name: step.name,
      text: step.text,
      image: step.image ? { '@type': 'ImageObject' as const, url: step.image } : undefined,
      url: step.url,
    })),
  };
}
