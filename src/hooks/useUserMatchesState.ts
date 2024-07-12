import type { UserState } from "@/app/user-machine";
import { useSyncExternalStore } from "react";
import { usePageSessionStore } from "./usePageSessionStore";
import { userMatchesState } from "@/utils/user-matches";

export const useUserMatchesState = (matchedState: UserState) => {
  const store = usePageSessionStore();
  return useSyncExternalStore(
    store.subscribe,
    () => {
      const value = store.get().context.userSnapshot?.value;
      return value ? userMatchesState(matchedState as any, value) : false;
    },
    () => {
      const value = store.get().context.userSnapshot?.value;
      return value ? userMatchesState(matchedState as any, value) : false;
    }
  );
};
