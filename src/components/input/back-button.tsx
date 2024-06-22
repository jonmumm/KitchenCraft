"use client";

import { useSend } from "@/hooks/useSend";
import { Slot } from "@radix-ui/react-slot";
import { ForwardRefRenderFunction, useCallback } from "react";
import { Button } from "./button";

interface BackButtonProps extends React.ComponentProps<typeof Button> {
  asChild?: boolean;
  children: React.ReactNode;
  disabled?: boolean; // Add the disabled prop
  // fallbackLocation?: string;
}

export const BackButton: ForwardRefRenderFunction<
  HTMLButtonElement,
  BackButtonProps
> = ({
  asChild,
  children,
  ...props
}: {
  asChild?: boolean;
  children: React.ReactNode;
  // fallbackLocation: string;
}) => {
  const Comp = asChild ? Slot : Button;
  const send = useSend();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      window.history.back();
      send({ type: "BACK" });
    },
    [send]
  );

  return (
    <Comp onClick={handleClick} {...props}>
      {children}
    </Comp>
  );
};
