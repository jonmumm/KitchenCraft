"use client";

import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { createRecipeIsSelectedSelector } from "@/selectors/page-session.selectors";
import { CheckIcon, CircleSlash2Icon } from "lucide-react";
import { useMemo } from "react";
import { Skeleton } from "./display/skeleton";
import { Button } from "./input/button";

export const RecipeSelectButton = ({ id }: { id: string | undefined }) => {
  const selectRecipeIsSelected = useMemo(
    () => createRecipeIsSelectedSelector(id),
    [id]
  );
  const isSelected = usePageSessionSelector(selectRecipeIsSelected);
  console.log({ isSelected, id });

  if (!id) {
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
          event={{ type: "SELECT_RECIPE", id }}
        >
          Select <CheckIcon className="ml-2" />
        </Button>
      ) : (
        <Button
          variant="outline"
          className="basis-32"
          event={{ type: "UNSELECT", id }}
        >
          Unselect <CircleSlash2Icon size={16} className="ml-2" />
        </Button>
      )}
    </>
  );
};
