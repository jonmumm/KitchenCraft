"use client";

import { Button } from "@/components/ui/button";
import { ReactNode, useCallback } from "react";

export const AddButton = ({ children }: { children: ReactNode }) => {
  const handlePress = useCallback(() => {
    alert("add not impelemented yet");
  }, []);

  return (
    <Button
      variant="outline"
      onClick={handlePress}
      // onClick={handlePressAddToLibrary}
      aria-label="Add To Library"
      className="flex flex-row gap-1"
    >{children}</Button>
  );
};
