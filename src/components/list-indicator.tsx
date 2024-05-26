"use client";

import { PageSessionSnapshot } from "@/app/page-session-machine";
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

const selectNumItemsInList = (snapshot: PageSessionSnapshot) => {
  return (
    snapshot.context.browserSessionSnapshot?.context.currentListRecipeIds
      .length || 0
  );
};

export const ListIndicator = () => {
  const numItemsInList = usePageSessionSelector(selectNumItemsInList);
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const onAddToList = useCallback(() => {
    setJustAdded(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setJustAdded(false);
      timerRef.current = null;
    }, 1500);
  }, [setJustAdded, timerRef]);

  useEventHandler("ADD_TO_LIST", onAddToList);

  return (
    <>
      {numItemsInList !== 0 && (
        <span className={"indicator-item"}>
          <span
            className={cn(
              "badge badge-neutral p-1 text-xs",
              justAdded ? "animate-bounce" : ""
            )}
          >
            {numItemsInList}
          </span>
        </span>
      )}
    </>
  );
};
