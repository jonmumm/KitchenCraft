import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { usePageSessionStore } from "./usePageSessionStore";

export const useSuggestedRecipeAtIndex = (index: number) => {
  const session$ = usePageSessionStore();
  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context;
    },
    () => {
      return session$.get().context;
    },
    (context) => {
      const id = context.suggestedRecipes[index];
      if (!id) {
        return undefined;
      }
      const recipe = context.recipes[id];
      return recipe;
    }
  );
};
