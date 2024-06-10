import type { UserState } from "@/app/user-machine";
import { useSyncExternalStore } from "react";
import { matchesState } from "xstate";
import { usePageSessionStore } from "./usePageSessionStore";

export const useUserMatchesState = (matchedState: UserState) => {
  const store = usePageSessionStore();
  return useSyncExternalStore(
    store.subscribe,
    () => {
      const value = store.get().context.userSnapshot?.value;
      return value ? matchesState(matchedState as any, value) : false;
    },
    () => {
      const value = store.get().context.userSnapshot?.value;
      return value ? matchesState(matchedState as any, value) : false;
    }
  );
};
