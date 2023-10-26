import {
  RecipePredictionOutputSchema,
  RecipeRequiredPropsSchema,
} from "@/schema";
import { z } from "zod";

const PartialRecipeSchema = RecipeRequiredPropsSchema.merge(
  RecipePredictionOutputSchema.shape.recipe.partial()
);

export const StorePropsSchema = z.object({
  loading: z.boolean(),
  recipe: PartialRecipeSchema,
});

export type StoreProps = z.infer<typeof StorePropsSchema>;
