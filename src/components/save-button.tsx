"use client";

import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { cn } from "@/lib/utils";
import { createRecipeIsSavedInListSelector } from "@/selectors/page-session.selectors";
import { BookmarkCheckIcon, BookmarkIcon } from "lucide-react";
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
  const Icon = isSaved ? BookmarkCheckIcon : BookmarkIcon;

  if (!id) {
    return (
      <Button className={className} variant={variant || "ghost"} disabled>
        {showText && <>Save</>}
        <Icon className={showText ? "ml-1" : ""} />
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
      <Icon
        className={cn(
          showText ? "ml-1" : ""
        )}
      />
    </Button>
  );
};
