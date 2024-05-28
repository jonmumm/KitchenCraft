"use client";

import { useSend } from "@/hooks/useSend";
import { AppEvent } from "@/types";
import { Slot } from "@radix-ui/react-slot";
import React, { ForwardRefRenderFunction, useCallback } from "react";

interface EventTriggerProps extends React.HTMLProps<HTMLDivElement> {
  event: AppEvent;
  asChild?: boolean;
  children: React.ReactNode;
  disabled?: boolean; // Add the disabled prop
}

const EventTrigger: ForwardRefRenderFunction<
  HTMLDivElement,
  EventTriggerProps
> = ({ event, asChild, children, disabled, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  const send = useSend();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }
      send(event);
      e.preventDefault();
      e.stopPropagation();
      // Add any additional logic if needed
    },
    [event, send, disabled]
  );

  return (
    <Comp onClick={handleClick} ref={ref as any} {...props}>
      {children}
    </Comp>
  );
};

export default React.forwardRef(EventTrigger);
