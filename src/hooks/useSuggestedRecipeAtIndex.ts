import { createSuggestedRecipeAtIndexSelector } from "@/selectors/combined.selectors";
import { useMemo } from "react";
import { useCombinedSelector } from "./useCombinedSelector";

export const useSuggestedRecipeAtIndex = (index: number) => {
  const selectSuggestedRecipe = useMemo(
    () => createSuggestedRecipeAtIndexSelector(index),
    [index]
  );
  return useCombinedSelector(selectSuggestedRecipe);
};
