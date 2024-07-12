import { PageSessionState } from "@/app/page-session-machine";
import { useEffect, useRef } from "react";
import { matchesState } from "xstate";
import { usePageSessionStore } from "./usePageSessionStore";

export const usePageSessionEnteredStateHandler = (
  matchedState: PageSessionState,
  handler: () => void
) => {
  const store = usePageSessionStore();
  const wasMatchedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const matched = matchesState(matchedState as any, store.get().value);

      if (matched && !wasMatchedRef.current) {
        handler();
      }

      wasMatchedRef.current = matched;
    });

    return () => unsubscribe();
  }, [matchedState, store, handler]);
};
