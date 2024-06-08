"use client";

import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { createRecipeIsFavoritedSelector } from "@/selectors/page-session.selectors";
import { HeartIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "./input/button";

export const FavoriteButton = ({ id }: { id?: string }) => {
  const selectRecipeIsFavoritedSelector = useMemo(
    () => createRecipeIsFavoritedSelector(id),
    [id]
  );
  const isFavorited = usePageSessionSelector(selectRecipeIsFavoritedSelector);

  if (!id) {
    return (
      <Button variant="ghost" disabled size="icon">
        <HeartIcon />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      event={{ type: "FAVORITE_RECIPE", id }}
    >
      <HeartIcon className={isFavorited ? "fill-black" : ""} />
    </Button>
  );
};
