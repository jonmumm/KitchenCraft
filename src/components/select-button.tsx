"use client";

import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { createRecipeIsSelectedSelector } from "@/selectors/page-session.selectors";
import { CheckIcon, CircleSlash2Icon } from "lucide-react";
import { useMemo } from "react";
import { Skeleton } from "./display/skeleton";
import { Button } from "./input/button";

export const SelectButton = ({ id }: { id?: string }) => {
  const selectRecipeIsSelected = useMemo(
    () => createRecipeIsSelectedSelector(id),
    [id]
  );
  const isSelected = usePageSessionSelector(selectRecipeIsSelected);

  if (!id) {
    return (
      <Button size="icon" className="flex-1 " disabled>
        <Skeleton className="w-10 h-4" />
      </Button>
    );
  }

  return (
    <>
      {!isSelected ? (
        <Button
          size="icon"
          className="flex-1 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white"
          event={{ type: "SELECT_RECIPE", id }}
        >
          Select <CheckIcon className="ml-2" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          className="flex-1"
          event={{ type: "UNSELECT", id }}
        >
          Unselect <CircleSlash2Icon className="ml-2" />
        </Button>
      )}
    </>
  );
};
