import type { z } from "zod";
import ingredients from "./data/ingredients.json";
import {
  CookingTimeSchema,
  CookwareSchema,
  CuisineSchema,
  DishTypeSchema,
  AppEventSchema,
  RecipeAttributeSchema,
  RecipeAttributesSchema,
  RecipeSchema,
  TechniqueSchema,
} from "./schema";

export type AppEvent = z.infer<typeof AppEventSchema>;

export type Ingredient = (typeof ingredients)[0];

export type Recipe = z.infer<typeof RecipeSchema>;
export type DishType = z.infer<typeof DishTypeSchema>;
export type CookingTime = z.infer<typeof CookingTimeSchema>;
export type Cookware = z.infer<typeof CookwareSchema>;
export type Technique = z.infer<typeof TechniqueSchema>;
export type Cuisine = z.infer<typeof CuisineSchema>;

export type RecipeAttributes = z.infer<typeof RecipeAttributesSchema>;
export type RecipeAttribute = z.infer<typeof RecipeAttributeSchema>;
