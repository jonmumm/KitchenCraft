"use client";

import { Button } from "@/components/ui/button";
import { ReactNode, useCallback } from "react";

export const UploadMediaButton = ({ children }: { children: ReactNode }) => {
  const handlePress = useCallback(() => {
    alert("photo/video upload not implemented");
  }, []);

  return (
    <Button
      variant="outline"
      onClick={handlePress}
      aria-label="Take Photo"
      className="flex flex-row gap-1"
    >
      {children}
    </Button>
  );
};
