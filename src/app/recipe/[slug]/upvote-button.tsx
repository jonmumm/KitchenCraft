"use client";

import { Button } from "@/components/input/button";
import { ReactNode } from "react";

export const UpvoteButton = ({ children }: { children: ReactNode }) => {
  const handlePress = () => {
    alert("upvote not implemented");
  };

  return (
    <Button
      variant="outline"
      className="flex flex-row gap-1"
      aria-label="Upvote"
      onClick={handlePress}
    >
      {children}
    </Button>
  );
};
