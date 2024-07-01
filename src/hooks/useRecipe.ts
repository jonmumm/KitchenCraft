import { createRecipeSelector } from "@/selectors/page-session.selectors";
import { useMemo } from "react";
import { usePageSessionSelector } from "./usePageSessionSelector";

export const useRecipe = (id?: string) => {
  const selectRecipe = useMemo(() => createRecipeSelector(id), [id]);
  return usePageSessionSelector(selectRecipe);
};
