import { RecipeSchema } from "@/db";
import { z } from "zod";

export const ContextSchema = z.object({
  currentSlug: z.string().optional(),
  currentMediaIndex: z.number().optional(),
  recipe: RecipeSchema.optional(),
});
