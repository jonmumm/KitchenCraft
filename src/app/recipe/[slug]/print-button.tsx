"use client";

import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

export const PrintButton = ({ children }: { children: ReactNode }) => {
  const handlePressPrint = () => {
    alert("print");
  };

  return (
    <Button
      variant="outline"
      onClick={handlePressPrint}
      aria-label="Print"
      className="flex flex-row gap-1"
    >
      {children}
    </Button>
  );
};
