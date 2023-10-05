import { kv } from "@vercel/kv";

import { assert, getChatRecipeSlug } from "@/lib/utils";
import { CreateRecipeInputSchema, LLMMessageSetIdSchema } from "@/schema";
import { Recipe } from "@/types";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  createRecipe: publicProcedure
    .input(CreateRecipeInputSchema)
    .mutation(async ({ input }) => {
      const { name, description, chatId } = input;
      const slug = getChatRecipeSlug(chatId, name);

      // assert it doesn't already exist
      const multi = await kv.multi();

      const now = Date.now();
      await multi.zadd(`chat:${chatId}:recipes`, {
        score: now,
        member: slug,
      });

      // use the last 3 messages in the chat by default
      // in future might want to have client specify
      // a message if able to create new recipes from
      // older messages in the chat
      const messageIds = LLMMessageSetIdSchema.parse(
        await kv.zrange(`chat:${chatId}:messages`, -3, -1)
      );
      console.log({ messageIds });
      // kv.zscan(`chat:${}`)

      await multi.hset(`recipe:${slug}`, {
        slug,
        name,
        description,
        chatId,
        queryMessageSet: messageIds,
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
