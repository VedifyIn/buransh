import type { BaseFrontmatter } from '../base';

type WithNutrition = BaseFrontmatter & {
  nutrition?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
};

type WithRating = BaseFrontmatter & {
  rating?: {
    value: number;
    bestRating?: number;
    worstRating?: number;
  };
};

export function getNutritionSchema(fm: WithNutrition) {
  if (!fm.nutrition) return undefined;
  const n = fm.nutrition;
  return {
    '@type': 'NutritionInformation' as const,
    calories: n.calories,
    proteinContent: n.protein,
    carbohydrateContent: n.carbs,
    fatContent: n.fat,
  };
}

export function getRatingSchema(fm: WithRating) {
  if (!fm.rating) return undefined;
  const r = fm.rating;
  return {
    '@type': 'Rating' as const,
    ratingValue: r.value,
    bestRating: r.bestRating ?? 5,
    worstRating: r.worstRating ?? 1,
  };
}
