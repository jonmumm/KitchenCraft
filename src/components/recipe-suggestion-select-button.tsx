"use client";

import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import {
  createFeedItemRecipeAtIndexSelector,
  createRecipeIsSelectedSelector,
} from "@/selectors/page-session.selectors";
import { CheckIcon, CircleSlash2Icon } from "lucide-react";
import { useMemo } from "react";
import { Skeleton } from "./display/skeleton";
import { Button } from "./input/button";

export const RecipeSuggestionSelectButton = ({
  itemIndex,
  recipeIndex,
}: {
  itemIndex: number;
  recipeIndex: number;
}) => {
  const recipeSelector = useMemo(
    () => createFeedItemRecipeAtIndexSelector({ itemIndex, recipeIndex }),
    [recipeIndex, itemIndex]
  );
  const recipe = usePageSessionSelector(recipeSelector);
  const recipeId = recipe?.id;
  const selectRecipeIsSelected = useMemo(
    () => createRecipeIsSelectedSelector(recipeId),
    [recipeId]
  );
  const isSelected = usePageSessionSelector(selectRecipeIsSelected);

  if (!recipe?.id) {
    return (
      <Button size="icon" className="basis-32" disabled>
        <Skeleton className="w-10 h-4" />
      </Button>
    );
  }

  return (
    <>
      {!isSelected ? (
        <Button
          size="icon"
          className="bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white basis-32"
          event={{ type: "SELECT_RECIPE_SUGGESTION", itemIndex, recipeIndex }}
        >
          Select <CheckIcon className="ml-2" />
        </Button>
      ) : recipe?.id ? (
        <Button
          variant="outline"
          className="basis-32"
          event={{ type: "UNSELECT", id: recipe.id }}
        >
          Unselect <CircleSlash2Icon size={14} className="ml-2" />
        </Button>
      ) : (
        <></>
      )}
    </>
  );
};
