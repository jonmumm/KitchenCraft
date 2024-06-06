"use client";

import { openAndPrintURL } from "@/lib/print";
import { PrinterIcon } from "lucide-react";
import { useCallback } from "react";
import { Button } from "./input/button";

export const PrintButton = ({ slug }: { slug?: string }) => {
  const handleClick = useCallback(() => {
    openAndPrintURL(`${window.location.origin}/recipe/${slug}`);
  }, [slug]);

  if (!slug) {
    return (
      <Button variant="ghost" disabled size="icon">
        <PrinterIcon className="ml-2" />
      </Button>
    );
  }

  return (
    <Button variant="ghost" onClick={handleClick} size="icon">
      <PrinterIcon className="ml-2" />
    </Button>
  );
};
