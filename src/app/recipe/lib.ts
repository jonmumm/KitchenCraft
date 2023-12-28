import { TempRecipe } from "@/types";
import { kv } from "@/lib/kv";

export const createRecipe = async (recipe: TempRecipe) => {
  await kv.hset(`recipe:${recipe.slug}`, recipe);
};
