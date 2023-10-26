"use client";

import { Message, Recipe, RecipeChatInput } from "@/types";
import { ReactNode } from "react";

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
  const input = {
    chatId,
    recipe,
    recipeMessages,
  } satisfies RecipeChatInput;

  // const actor = useActor(
  //   `recipeChat:${chatId}`,
  //   createRecipeChatMachine({
  //     initialStatus: "Viewing",
  //   }),
  //   { input }
  // );

  return <>{children}</>;
}
