import { AutoSuggestTokensEventBase } from "@/app/auto-suggest-tokens.stream";
import { InstantRecipeMetadataEventBase } from "@/app/instant-recipe/streams";
import { env } from "@/env.public";
import { noop } from "@/lib/utils";
import type { Caller } from "@/types";
import { PostHog } from "posthog-node";
import { z } from "zod";

const PostHogServerSentEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("LLM_CALL"),
    properties: z.object({
      llmType: z.enum([
        "PLACEHOLDER",
        InstantRecipeMetadataEventBase,
        "FULL_RECIPE",
        AutoSuggestTokensEventBase,
        "SUGGEST_CHEF_NAMES",
        "SUGGEST_PLACEHOLDERS",
        "SUGGEST_TOKENS",
        "SUGGEST_TAGS",
        "SUGGEST_INGREDIENTS",
        "SUGGEST_LIST_NAMES",
      ]),
    }),
  }),
]);

type EventVariants = {
  postHogClient?: PostHog;
  caller?: Caller;
  type?: string; // Assuming 'type' and other properties might be part of the event object
  [key: string]: any; // For any additional unexpected properties
};

export const captureEvent = (
  uniqueId: string,
  eventToSend: z.infer<typeof PostHogServerSentEventSchema>
) => {
  const client = new PostHog(env.POSTHOG_CLIENT_KEY, {
    host: "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
    bootstrap: {
      distinctId: uniqueId,
    },
  });
  client.capture({
    distinctId: uniqueId,
    event: eventToSend.type,
    properties: eventToSend.properties,
  });
  client.shutdownAsync().then(noop);
};
