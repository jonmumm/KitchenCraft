"use client";

import { trpc } from "@/app/_trpc/client";
import {
  RecipeChatContext,
  createRecipeChatMachine,
} from "@/context/recipe-chat";
import { useActor } from "@/hooks/useActor";
import { Message, Recipe, RecipeChatInput } from "@/types";
import { ReactNode, useLayoutEffect } from "react";

/**
 * Connects the main page actor to the "event bus"
 */
export default function Provider({
  children,
  chatId,
  recipe,
  recipeMessages,
}: {
  children: ReactNode;
  recipe: Recipe;
  chatId: string;
  userId: string | undefined;
  sessionId: string;
  recipeMessages: Message[];
}) {
  const { client: trpcClient } = trpc.useContext();

  const input = {
    chatId,
    recipe,
    recipeMessages,
  } satisfies RecipeChatInput;

  const actor = useActor(
    `recipeChat:${chatId}`,
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
