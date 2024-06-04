import { BrowserSessionState } from "@/app/browser-session-machine";
import { useSyncExternalStore } from "react";
import { matchesState } from "xstate";
import { usePageSessionStore } from "./usePageSessionStore";

export const useSessionMatchesState = (matchedState: BrowserSessionState) => {
  const store = usePageSessionStore();
  return useSyncExternalStore(
    store.subscribe,
    () => {
      const value = store.get().context.browserSessionSnapshot?.value;
      return value ? matchesState(matchedState as any, value) : false;
    },
    () => {
      const value = store.get().context.browserSessionSnapshot?.value;
      return value ? matchesState(matchedState as any, value) : false;
    }
  );
};
