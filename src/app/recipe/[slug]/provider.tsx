"use client";

import { RecipeChatContext } from "@/components/recipe-chat";
import { useActor } from "@/hooks/useActor";
import { useEventBus } from "@/hooks/useEventBus";
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
  const actor = useActor(
    "recipeChat",
    createRecipeChatMachine({
      userId,
      sessionId,
      slug,
    })
  );
  useEventBus(actor);

  return (
    <RecipeChatContext.Provider value={actor}>
      {children}
    </RecipeChatContext.Provider>
  );
}
