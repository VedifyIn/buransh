import { z } from 'zod';
import { baseSchema } from '../base';
import { ingredientSchema, instructionSchema, nutritionSchema } from '../nested';
import { dietSchema } from '../enums';

export const recipeSchema = baseSchema.extend({
  type: z.literal('Recipe'),
  ingredients: z.array(ingredientSchema).optional(),
  instructions: z.array(instructionSchema).optional(),
  nutrition: nutritionSchema.optional(),
  cookingMethod: z.string().optional(),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
  yields: z.string().optional(),
  recipeCategory: z.string().optional(),
  recipeCuisine: z.string().optional(),
  suitableForDiet: z.array(dietSchema).optional(),
});

export type RecipeFrontmatter = z.infer<typeof recipeSchema>;
