import { kv } from "@vercel/kv";

import { CreateMessageInputSchema, CreateRecipeInputSchema } from "@/schema";
import { Message } from "@/types";
import { nanoid } from "ai";
import { publicProcedure, router } from "./trpc";
import { getChatRecipeSlug } from "@/lib/utils";

export const appRouter = router({
  createMessage: publicProcedure
    .input(CreateMessageInputSchema)
    .mutation(async ({ input }) => {
      const { content, type, chatId } = input;
      const id = input.id || nanoid();
      const role = "user";

      const multi = await kv.multi();

      const message = {
        id,
        role,
        content,
        type,
        chatId,
      } satisfies Message;

      // Set message data using a hash
      await multi.hset(`message:${id}`, message);

      // Add the message ID to a sorted set of messages for the chat, using the timestamp as the score
      const timestamp = Date.now();
      await multi.zadd(`chat:${chatId}:messages`, {
        score: timestamp,
        member: id,
      });

      await multi.exec();

      return {
        success: true,
        message,
      };
    }),
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
      await multi.hset(`recipe:${slug}`, {
        slug,
        name,
        description,
        chatId,
      });
      await multi.exec();

      return {
        success: true,
        recipe: {
          slug,
          name,
          description,
          chatId,
        },
      };
    }),
});

// This type will be used as a reference later...
export type AppRouter = typeof appRouter;
