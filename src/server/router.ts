import { kv } from "@vercel/kv";

import { assert, getChatRecipeSlug } from "@/lib/utils";
import {
  CreateRecipeInputSchema,
  MessageIdSchema,
  MessageSchema,
} from "@/schema";
import { publicProcedure, router } from "./trpc";
import { Message, Recipe } from "@/types";

export const appRouter = router({
  createRecipe: publicProcedure
    .input(CreateRecipeInputSchema)
    .mutation(async ({ input }) => {
      const { name, description, chatId } = input;
      const slug = getChatRecipeSlug(chatId, name);

      // const data = await kv.zrange(`chat:${chatId}:messages`, 0, 2, {
      //   rev: true,
      // });

      // const messageIds = data.map((d) => MessageIdSchema.parse(d));
      // assert(
      //   messageIds.length === 3,
      //   "expected 3 messages on chat when creating recipe"
      // );

      // assert it doesn't already exist
      const multi = await kv.multi();

      const now = Date.now();
      await multi.zadd(`chat:${chatId}:recipes`, {
        score: now,
        member: slug,
      });

      await multi.hset(`recipe:${slug}`, {
        slug,
        name,
        description,
        chatId,
        // messageIds,
      } satisfies Recipe);

      await multi.exec();

      return {
        success: true,
        recipe: {
          slug,
          name,
          description,
          chatId,
          // messageIds,
        },
      };
    }),
});

// This type will be used as a reference later...
export type AppRouter = typeof appRouter;
