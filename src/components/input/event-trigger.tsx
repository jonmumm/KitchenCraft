"use client";

import { useSend } from "@/hooks/useSend";
import { AppEvent } from "@/types";
import { Slot } from "@radix-ui/react-slot";
import React, { ForwardRefRenderFunction, useCallback } from "react";

interface EventTriggerProps extends React.HTMLProps<HTMLDivElement> {
  event: AppEvent;
  asChild?: boolean;
  children: React.ReactNode;
}

const EventTrigger: ForwardRefRenderFunction<
  HTMLDivElement,
  EventTriggerProps
> = ({ event, asChild, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  const send = useSend();

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    send(event);
    // Add any additional logic if needed
  }, []);

  return (
    <Comp onClick={handleClick} ref={ref as any} {...props}>
      {children}
    </Comp>
  );
};

export default React.forwardRef(EventTrigger);
