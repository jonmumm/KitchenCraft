"use client";

import { openAndPrintURL } from "@/lib/print";
import { PrinterIcon } from "lucide-react";
import { ComponentProps, useCallback } from "react";
import { Button } from "./input/button";

export const PrintButton = ({
  slug,
  variant,
}: {
  slug?: string;
  variant?: ComponentProps<typeof Button>["variant"];
}) => {
  const handleClick = useCallback(() => {
    openAndPrintURL(`${window.location.origin}/recipe/${slug}`);
  }, [slug]);

  if (!slug) {
    return (
      <Button variant={"outline"} disabled size="icon">
        <PrinterIcon />
      </Button>
    );
  }

  return (
    <Button variant={"outline"} onClick={handleClick} size="icon">
      <PrinterIcon />
    </Button>
  );
};
