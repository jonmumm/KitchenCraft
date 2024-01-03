import { z } from "zod";
import { RecipeSchema } from "@/db";

export const RecipeDataSchema = RecipeSchema.pick({
  name: true,
  slug: true,
  description: true,
  yield: true,
  tags: true,
  ingredients: true,
  instructions: true,
});
export type RecipeData = z.infer<typeof RecipeDataSchema>;