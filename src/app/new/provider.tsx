"use client";

import { trpc } from "@/app/_trpc/client";
import {
  RecipeChatContext,
  createRecipeChatMachine,
} from "@/components/recipe-chat";
import { useActor } from "@/hooks/useActor";
import { ReactNode } from "react";

/**
 * Connects the main page actor to the "event bus"
 */
export default function Provider({
  children,
  userId,
  chatId,
  sessionId,
}: {
  children: ReactNode;
  userId: string | undefined;
  chatId: string;
  sessionId: string;
}) {
  const { client: trpcClient } = trpc.useContext();
  const actor = useActor(
    `recipeChat:${chatId}`,
    createRecipeChatMachine({
      trpcClient,
      initialStatus: "New",
    }),
    {
      input: {
        name: undefined,
        description: undefined,
        slug: undefined,
        chatId,
        recipeMessages: [],
      },
    }
  );

  return (
    <RecipeChatContext.Provider value={actor}>
      {children}
    </RecipeChatContext.Provider>
  );
}
