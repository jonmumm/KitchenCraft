import { PageSessionState } from "@/app/page-session-machine";
import { useSyncExternalStore } from "react";
import { matchesState } from "xstate";
import { usePageSessionStore } from "./usePageSessionStore";

export const usePageSessionStoreMatchesState = (
  matchedState: PageSessionState
) => {
  const store = usePageSessionStore();
  return useSyncExternalStore(
    store.subscribe,
    () => {
      return matchesState(matchedState as any, store.get().value);
    },
    () => {
      return matchesState(matchedState as any, store.get().value);
    }
  );
};
