import { UserState } from "@/app/user-machine";
import { useEffect, useRef } from "react";
import { matchesState } from "xstate";
import { usePageSessionStore } from "./usePageSessionStore";

export const useUserMatchesStateHandler = (
  matchedState: UserState,
  handler: () => void
) => {
  const store = usePageSessionStore();
  const wasMatchedRef = useRef(false);
  const handlerRef = useRef(handler);

  // Update the handler ref if it changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const value = store.get().context.userSnapshot?.value;
      const matched = value ? matchesState(matchedState as any, value) : false;

      if (matched && !wasMatchedRef.current) {
        handlerRef.current();
      }

      wasMatchedRef.current = matched;
    });

    return () => unsubscribe();
  }, [matchedState, store]);

  return wasMatchedRef.current;
};
