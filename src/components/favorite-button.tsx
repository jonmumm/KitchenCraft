"use client";

import { HeartIcon } from "lucide-react";
import { Button } from "./input/button";

export const FavoriteButton = ({ slug }: { slug?: string }) => {
  if (!slug) {
    return (
      <Button variant="ghost" disabled className="flex-2">
        <HeartIcon className="ml-2" />
      </Button>
    );
  }

  return (
    <Button variant="ghost">
      <HeartIcon className="ml-2" />
    </Button>
  );
};
