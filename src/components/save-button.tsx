"use client";

import React from 'react';
import { BookmarkIcon } from "lucide-react";
import { Button, ButtonProps } from "./input/button";

export const SaveButton = ({
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
      <Button 
        className={className} 
        variant={variant || "ghost"} 
        disabled
      >
        {showText && <>Save</>}
        <BookmarkIcon className={showText ? "ml-1" : ""} />
      </Button>
    );
  }

  return (
    <Button 
      className={className}
      variant={variant || "outline"} 
      event={{ type: "SAVE_RECIPE", recipeId: id }}
    >
      {showText && <>Save</>}
      <BookmarkIcon className={showText ? "ml-1" : ""} />
    </Button>
  );
};