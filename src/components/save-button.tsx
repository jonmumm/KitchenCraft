"use client";

import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { cn } from "@/lib/utils";
import { createRecipeIsSavedInListSelector } from "@/selectors/page-session.selectors";
import { BookmarkIcon } from "lucide-react";
import { Button, ButtonProps } from "./input/button";

export const SaveButton = ({
  id,
  className,
  variant,
  showText = true,
}: {
  id?: string;
  className?: string;
  variant?: ButtonProps["variant"];
  showText?: boolean;
}) => {
  const selectRecipeIsSavedInList = createRecipeIsSavedInListSelector(id);
  const isSaved = usePageSessionSelector(selectRecipeIsSavedInList);

  if (!id) {
    return (
      <Button className={className} variant={variant || "ghost"} disabled>
        {showText && <>Save</>}
        <BookmarkIcon className={showText ? "ml-1" : ""} />
      </Button>
    );
  }

  return (
    <Button
      className={className}
      variant={variant || "outline"}
      event={
        !isSaved
          ? { type: "SAVE_RECIPE", recipeId: id }
          : { type: "CHANGE_LIST" }
      }
    >
      {showText && <>Save</>}
      <BookmarkIcon
        className={cn(
          isSaved ? "fill-slate-700 stroke-black" : "",
          showText ? "ml-1" : ""
        )}
      />
    </Button>
  );
};
