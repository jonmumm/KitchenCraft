import { Recipe } from "@/types";
import { kv } from "@vercel/kv";

export const createRecipe = async (recipe: Recipe) => {
  await kv.hset(`recipe:${recipe.slug}`, recipe);
};
