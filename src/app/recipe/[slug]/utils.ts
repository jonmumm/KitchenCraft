import { TempRecipeSchema } from "@/schema";
import { RecipeSlug } from "@/types";
import { kv } from "@/lib/kv";

export const getRecipe = async (slug: RecipeSlug) =>
  TempRecipeSchema.parse(await kv.hgetall(`recipe:${slug}`));
