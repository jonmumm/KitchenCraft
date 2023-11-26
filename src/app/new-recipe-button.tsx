"use client";

import { Button } from "@/components/input/button";
import { useSend } from "@/hooks/useSend";
import { ComponentProps, forwardRef, useCallback } from "react";

export const NewRecipeButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof Button>
>(({ children, ...rest }, ref) => {
  const send = useSend();
  const handleClick = useCallback(() => {
    send({ type: "NEW_RECIPE" });
  }, [send]);

  return (
    <Button onClick={handleClick} ref={ref} {...rest}>
      {children}
    </Button>
  );
});

NewRecipeButton.displayName = "NewRecipeButton";
