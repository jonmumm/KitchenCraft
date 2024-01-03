import { kv } from "@/lib/kv";
import { RecipeBaseSchema, TempRecipeSchema } from "@/schema";
import { cache } from "react";
import { z } from "zod";

export const getTempRecipe = async (slug: string) => {
  const recipeKey = `recipe:${slug}`;
  return TempRecipeSchema.parse(await kv.hgetall(recipeKey));
};

// If the runStatus is in initializing, it means whoever is calling
// this is
export const getShouldCreateRecipe = cache(async (slug: string) => {
  const { runStatus } = await getTempRecipe(slug);
  const shouldCreaateRecipe = runStatus === "initializing";

  if (runStatus === "initializing") {
    await kv.hset(`recipe:${slug}`, { runStatus: "starting" });
  }

  return shouldCreaateRecipe;
});

export const getRecipeOutputRaw = async (slug: string) =>
  z.string().parse((await kv.hget(`recipe:${slug}`, "outputRaw")) || "");

// export const setRecipeOutputRaw = async (slug: string, outputRaw: string) => {
//   // revalidateTag(`recipe:${slug}`);
//   await unstable_cache(
//     async () => {
//       kv.hset(`recipe:${slug}`, { outputRaw }).then(noop);
//       return outputRaw;
//     },
//     [`recipe`, slug],
//     { tags: [`recipe:${slug}`] }
//   )();
// };

export const getBaseRecipe = cache(async (slug: string) =>
  RecipeBaseSchema.parse(await kv.hgetall(`recipe:${slug}`))
);
