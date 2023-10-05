"use client";

import { trpc } from "@/app/_trpc/client";
import {
  RecipeChatContext,
  createRecipeChatMachine,
} from "@/components/recipe-chat";
import { useActor } from "@/hooks/useActor";
import { Message, RecipeChatInput } from "@/types";
import { ReactNode } from "react";

/**
 * Connects the main page actor to the "event bus"
 */
export default function Provider({
  children,
  name,
  description,
  chatId,
  slug,
  recipeMessages,
}: {
  children: ReactNode;
  name: string;
  description: string;
  chatId: string;
  userId: string | undefined;
  sessionId: string;
  slug: string;
  recipeMessages: Message[];
}) {
  const { client: trpcClient } = trpc.useContext();

  const input = {
    chatId,
    name,
    slug,
    description,
    recipeMessages,
  } satisfies RecipeChatInput;

  const actor = useActor(
    "recipeChat",
    createRecipeChatMachine({
      initialStatus: "Viewing",
      trpcClient,
    }),
    { input }
  );

  return (
    <RecipeChatContext.Provider value={actor}>
      {children}
    </RecipeChatContext.Provider>
  );
}
