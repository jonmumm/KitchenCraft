"use client";

import { HeartIcon } from "lucide-react";
import { Button } from "./input/button";

export const FavoriteButton = ({ slug }: { slug?: string }) => {
  if (!slug) {
    return (
      <Button variant="ghost" disabled size="icon">
        <HeartIcon />
      </Button>
    );
  }

  return (
    <Button variant="outline" size="icon">
      <HeartIcon />
    </Button>
  );
};
