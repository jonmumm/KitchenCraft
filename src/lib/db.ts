import {
  LLMMessageSetIdSchema,
  LLMMessageSetSchema,
  MessageSchema,
  RecipeSchema,
  ResultSchema,
  SlugSchema,
  SuggestionSchema,
} from "@/schema";
import { LLMMessageSetId, RecipeSlug } from "@/types";
import { kv as _kv } from "@vercel/kv";
import { z } from "zod";

type KV = typeof _kv;

// const CraftSchema = z.object({
//   message
// });

export const getRecentRecipeSlugs = async (kv: KV) =>
  z
    .array(SlugSchema)
    .parse(await kv.zrange(`recipes:new`, 0, -1, { rev: true }));

export const getRecentRecipes = async (kv: KV) => {
  // Fetch slugs/keys for the recipes
  const slugs = await kv.zrange(`recipes:new`, 0, -1, { rev: true });

  // Create a multi-execution context
  const multi = kv.multi();

  // Queue up the commands to fetch each recipe
  slugs.forEach((slug) => {
    multi.hgetall(`recipe:${slug}`);
  });

  // Execute all queued commands in a single round trip
  const results = await multi.exec();

  // Parse and return the recipes
  return results
    .map((result, index) => {
      try {
        return RecipeSchema.parse(result);
      } catch (err) {
        console.error(
          `Error parsing recipe data for slug ${slugs[index]}:`,
          err
        );
        return null;
      }
    })
    .filter((recipe) => recipe !== null); // Filter out any nulls from parsing errors
};

// export const getCraft = async (kv: KV, id: string) =>
//   CraftSchema.parse(await kv.hgetall(`craft:${id}`));

export const getRecipe = async (kv: KV, slug: RecipeSlug) =>
  RecipeSchema.parse(await kv.hgetall(`recipe:${slug}`));

export const getModificationMessages = async (kv: KV, slug: RecipeSlug) => {
  const messageSetId = await LLMMessageSetIdSchema.parse(
    await kv.hget(`recipe:${slug}`, "modificationsMessageSet")
  );
  return await getLLMMessageSet(kv, messageSetId);
};

export const getMessage = async (kv: KV, id: string) =>
  MessageSchema.parse(await kv.hgetall(`message:${id}`));

export const getLLMMessageSet = async (
  kv: typeof _kv,
  messageSetId: LLMMessageSetId
) => {
  const [systemMessage, userMessage, assistantMessage] = await Promise.all([
    await getMessage(kv, messageSetId[0]),
    await getMessage(kv, messageSetId[1]),
    await getMessage(kv, messageSetId[2]),
  ]);

  return LLMMessageSetSchema.parse([
    systemMessage,
    userMessage,
    assistantMessage,
  ]);
};

export const getSuggestions = async (kv: typeof _kv, inputHash: string) => {
  const output = await kv.hget(`suggestions:${inputHash}`, "output");
  return z.object({ suggestions: z.array(SuggestionSchema) }).parse(output);
};

export const getResult = async (kv: typeof _kv, id: string) => {
  const resultKey = `result:${id}`;
  const result = await kv.hgetall(resultKey);
  return ResultSchema.parse(result);
};
