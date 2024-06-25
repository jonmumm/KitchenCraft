"use client";

import { ThumbsUpIcon } from "lucide-react";
import { Button, ButtonProps } from "./input/button";
import { Popover, PopoverContent, PopoverTrigger } from "./layout/popover";

export const LikeButton = ({
  id,
  className,
  variant,
  showText = false,
}: {
  id?: string;
  className?: string;
  variant?: ButtonProps["variant"];
  showText?: boolean;
}) => {
  if (!id) {
    return (
      <Button className={className} variant={variant || "ghost"} disabled>
        {showText && <>Like</>}
        <ThumbsUpIcon className="ml-1" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={className}
          variant={variant || "outline"}
          event={{ type: "LIKE_RECIPE", recipeId: id }}
        >
          {showText && <>Like</>}
          <ThumbsUpIcon className="ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit px-2 py-1">
        Added to <span className="underline font-semibold">Liked Recipes</span>
      </PopoverContent>
    </Popover>
  );
};
