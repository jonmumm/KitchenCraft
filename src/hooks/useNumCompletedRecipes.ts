import { useSyncExternalStore } from "react";
import { usePageSessionStore } from "./usePageSessionStore";

export const useNumCompletedRecipes = () => {
  const session$ = usePageSessionStore();
  return useSyncExternalStore(
    session$.subscribe,
    () => {
      return session$.get().context.numCompletedRecipes;
    },
    () => {
      return session$.get().context.numCompletedRecipes;
    }
  );
};
