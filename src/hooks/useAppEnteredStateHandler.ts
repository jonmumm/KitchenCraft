import type { AppState } from "@/app/app-machine";
import { useEffect, useRef } from "react";
import { matchesState } from "xstate";
import { useAppContext } from "./useAppContext"; // Import your context hook

export const useAppEnteredStateHandler = (
  matchedState: AppState,
  handler: () => void
) => {
  const actor = useAppContext();
  const wasMatchedRef = useRef(false);
  const handlerRef = useRef(handler);

  // Update the handler ref if it changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const sub = actor.subscribe(() => {
      const value = actor.getSnapshot().value;
      const matched = value ? matchesState(matchedState as any, value) : false;

      if (matched && !wasMatchedRef.current) {
        handlerRef.current();
      }

      wasMatchedRef.current = matched;
    });

    return () => sub.unsubscribe();
  }, [matchedState, actor]);

  return wasMatchedRef.current;
};
