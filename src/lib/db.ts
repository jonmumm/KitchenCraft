import {
  LLMMessageSetSchema,
  MessageSchema,
  RecipeSchema,
  SlugSchema,
} from "@/schema";
import { LLMMessageSetId, RecipeSlug } from "@/types";
import { kv as _kv } from "@vercel/kv";
import { z } from "zod";

type KV = typeof _kv;

export const getRecentRecipeSlugs = async (kv: KV) =>
  z
    .array(SlugSchema)
    .parse(await kv.zrange(`recipes:new`, 0, -1, { rev: true }));

export const getRecipe = async (kv: KV, slug: RecipeSlug) =>
  RecipeSchema.parse(await kv.hgetall(`recipe:${slug}`));

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
