"use client";

import { RecipeChat } from "@/components/recipe-chat";
import { useEventHandler } from "@/hooks/useEventHandler";
import { useCallback, useState } from "react";

export const Content = () => {
  const [showNullState, setShowNullState] = useState(true);

  const handleFocusPrompt = useCallback(() => {
    setShowNullState(false);
  }, [setShowNullState]);
  useEventHandler("FOCUS_PROMPT", handleFocusPrompt);

  return (
    <div
      className={`flex flex-col flex-end flex-1 ${
        showNullState ? "justify-end" : "justify-start"
      } pt-16 overflow-hidden`}
    >
      {showNullState && (
        <div className="text-center text-muted-foreground my-auto">
          <h2 className="text-2xl">Mise en place</h2>
          <p>Create a plan. Adapt as you go.</p>
        </div>
      )}
      <RecipeChat />
    </div>
  );
};
