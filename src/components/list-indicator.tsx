"use client";

import { PageSessionSnapshot } from "@/app/page-session-machine";
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

const selectNumItemsInList = (snapshot: PageSessionSnapshot) => {
  return (
    snapshot.context.sessionSnapshot?.context.selectedRecipeIds
      .length || 0
  );
};

export const ListIndicator = () => {
  const numItemsInList = usePageSessionSelector(selectNumItemsInList);
  const [justSelected, setWasJustSelected] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const onSelectRecipe = useCallback(() => {
    setWasJustSelected(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setWasJustSelected(false);
      timerRef.current = null;
    }, 1500);
  }, [setWasJustSelected, timerRef]);

  useEventHandler("SELECT_RECIPE", onSelectRecipe);

  return (
    <>
      {numItemsInList !== 0 && (
        <span className={"indicator-item"}>
          <span
            className={cn(
              "badge bg-purple-500 text-white p-1 text-xs",
              justSelected ? "animate-bounce" : ""
            )}
          >
            {numItemsInList}
          </span>
        </span>
      )}
    </>
  );
};
