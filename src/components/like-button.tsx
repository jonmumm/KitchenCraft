"use client";

import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import { createRecipeIsLikedSelector } from "@/selectors/page-session.selectors";
import { HeartIcon, ThumbsUpIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const send = useSend();

  const selectRecipeIsLiked = createRecipeIsLikedSelector(id);
  const isLiked = usePageSessionSelector(selectRecipeIsLiked);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      // event={{ type: "LIKE_RECIPE", recipeId: id }}
      if (id && value) {
        send({ type: "LIKE_RECIPE", recipeId: id });
        // } else if (id && !value) {
        //   send({ type: "UNLIKE_RECIPE", recipeId: id });
      }
      setOpen(value);
    },
    [setOpen, id]
  );

  const handleUnlikeRecipe = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  useEventHandler("UNLIKE_RECIPE", handleUnlikeRecipe);

  if (!id) {
    return (
      <Button
        className={cn(className, "border-yellow-700")}
        variant={variant || "ghost"}
        disabled
      >
        {showText && <>Like</>}
        <ThumbsUpIcon className="ml-1" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild={!isLiked}>
        <Button
          className={className}
          variant={variant || "outline"}
          event={{ type: "UNLIKE_RECIPE", recipeId: id }}
        >
          {showText && <>Like</>}
          <HeartIcon className={cn(isLiked ? "fill-black" : "", "ml-1")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit px-2 py-1">
        Added to{" "}
        <Link href="?#liked" className="underline font-semibold">
          Liked Recipes
        </Link>
      </PopoverContent>
    </Popover>
  );
};
