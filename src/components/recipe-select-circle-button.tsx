"use client";

import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { cn } from "@/lib/utils";
import {
  createRecipeIsSelectedSelector,
  createRecipeSelector,
} from "@/selectors/page-session.selectors";
import { CheckIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "./input/button";

export const RecipeSelectCircleButton = ({
  id,
}: {
  id: string | undefined;
}) => {
  const selectRecipe = useMemo(() => createRecipeSelector(id), [id]);
  const selectItemIsSelected = useMemo(
    () => createRecipeIsSelectedSelector(id),
    [id]
  );
  const recipe = usePageSessionSelector(selectRecipe);
  const isSelected = usePageSessionSelector(selectItemIsSelected);

  return (
    <Button
      event={
        id
          ? !isSelected
            ? { type: "SELECT_RECIPE", id: id }
            : { type: "UNSELECT", id: id }
          : undefined
      }
      className={cn(
        "rounded-full",
        recipe?.name ? "" : "opacity-30",
        isSelected
          ? "border-purple-700 border-2 border-solid bg-purple-900 hover:bg-purple-800"
          : ""
      )}
      variant="outline"
      size="icon"
    >
      <CheckIcon className={!isSelected ? "" : "block text-white"} />
    </Button>
  );
};
