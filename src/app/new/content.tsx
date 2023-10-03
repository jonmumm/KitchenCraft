"use client";

import { RecipeChat, RecipeChatContext } from "@/components/recipe-chat";
import { useSelector } from "@/hooks/useSelector";
import { useContext } from "react";

export const Content = () => {
  const actor = useContext(RecipeChatContext);
  const isNullState = useSelector(
    actor,
    (state) =>
      state.matches("Focus.None") && !state.matches("Configurator.Open")
  );

  return (
    <div className={`flex flex-col flex-end flex-1 pt-16 overflow-hidden`}>
      {isNullState && (
        <div className="text-center text-muted-foreground my-auto">
          <h2 className="text-2xl">Mise en place</h2>
          <p>Create a plan. Adapt as you go.</p>
        </div>
      )}
      <RecipeChat />
    </div>
  );
};
