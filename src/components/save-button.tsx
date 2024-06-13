"use client";

import { BookmarkIcon } from "lucide-react";
import { Button } from "./input/button";

export const SaveButton = ({ id }: { id?: string }) => {
  if (!id) {
    return (
      <Button variant="ghost" disabled>
        Save
        <BookmarkIcon className="ml-1" />
      </Button>
    );
  }

  return (
    <Button variant="outline" event={{ type: "SAVE_RECIPE", recipeId: id }}>
      Save
      <BookmarkIcon className="ml-1" />
    </Button>
  );
};
