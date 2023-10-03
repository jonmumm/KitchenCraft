import { kv } from "@vercel/kv";

import { CreateRecipeInputSchema } from "@/schema";
import { nanoid } from "ai";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  createRecipe: publicProcedure
    .input(CreateRecipeInputSchema)
    .mutation(async ({ input }) => {
      const { slug, name, description, messages } = input;
      // assert it doesn't already exist
      const recipeId = await kv.get(`recipe:slug:${slug}`);
      if (recipeId) {
        // todo throw more specific trpc error
        throw new Error("Recipe for slug already exists");
      }

      const recipe = {
        name,
        description,
        slug,
      };

      const multi = await kv.multi();
      multi.set(`recipe:${slug}`, recipe);
      messages.forEach((message) =>
        multi.lpush(`recipe:${slug}:messages`, message)
      );
      await multi.exec();

      return recipe;
    }),
});

// This type will be used as a reference later...
export type AppRouter = typeof appRouter;
