"use client";

import { trpc } from "@/app/_trpc/client";
import { RecipeChatContext } from "@/components/recipe-chat";
import { useActor } from "@/hooks/useActor";
import { createRecipeChatMachine } from "@/machines/recipe-chat";
import { ReactNode } from "react";

/**
 * Connects the main page actor to the "event bus"
 */
export default function Provider({
  children,
  userId,
  sessionId,
  slug,
}: {
  children: ReactNode;
  userId: string | undefined;
  sessionId: string;
  slug: string;
}) {
  const { client: trpcClient } = trpc.useContext();

  const actor = useActor(
    "recipeChat",
    createRecipeChatMachine({
      userId,
      sessionId,
      slug,
      trpcClient,
    })
  );

  return (
    <RecipeChatContext.Provider value={actor}>
      {children}
    </RecipeChatContext.Provider>
  );
}
