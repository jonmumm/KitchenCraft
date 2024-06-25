"use client";

import React, { forwardRef } from 'react';
import { useSend } from "@/hooks/useSend";
import { Slot } from "@radix-ui/react-slot";
import { Button, ButtonProps } from "./button";

interface BackButtonProps extends Omit<ButtonProps, 'onClick'> {
  asChild?: boolean;
  children: React.ReactNode;
  // fallbackLocation?: string;
}

export const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(({
  asChild,
  children,
  className,
  variant = "outline",
  ...props
}, ref) => {
  const Comp = asChild ? Slot : Button;
  const send = useSend();
  
  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    window.history.back();
    send({ type: "BACK" });
  }, [send]);

  return (
    <Comp 
      onClick={handleClick} 
      className={className}
      variant={variant}
      ref={ref}
      {...props}
    >
      {children}
    </Comp>
  );
});

BackButton.displayName = 'BackButton';