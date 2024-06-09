import { SessionState } from "@/app/session-machine";
import { useSyncExternalStore } from "react";
import { matchesState } from "xstate";
import { usePageSessionStore } from "./usePageSessionStore";

export const useSessionMatchesState = (matchedState: SessionState) => {
  const store = usePageSessionStore();
  return useSyncExternalStore(
    store.subscribe,
    () => {
      const value = store.get().context.sessionSnapshot?.value;
      return value ? matchesState(matchedState as any, value) : false;
    },
    () => {
      const value = store.get().context.sessionSnapshot?.value;
      return value ? matchesState(matchedState as any, value) : false;
    }
  );
};
