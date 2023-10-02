"use client";

import { RecipeChatContext } from "@/components/recipe-chat";
import { ApplicationContext } from "@/context/application";
import { useActor } from "@/hooks/useActor";
import { useEventBus } from "@/hooks/useEventBus";
import { createRecipeChatMachine } from "@/machines/recipe-chat";
import { useStore } from "@nanostores/react";
import { ReactNode, useContext, useLayoutEffect, useState } from "react";
import { createActor } from "xstate";

/**
 * Connects the main page actor to the "event bus"
 */
export default function Provider({
  children,
  userId,
  sessionId,
}: {
  children: ReactNode;
  userId: string | undefined;
  sessionId: string;
}) {
  const actor = useActor(
    "recipeChat",
    createRecipeChatMachine({
      userId,
      sessionId,
    })
  );

  useLayoutEffect(() => {
    actor.start();
    return () => {
      actor.stop();
    };
  }, [actor]);

  useEventBus(actor);

  return (
    <RecipeChatContext.Provider value={actor}>
      {children}
    </RecipeChatContext.Provider>
  );
}
