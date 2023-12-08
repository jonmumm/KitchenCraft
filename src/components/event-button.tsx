"use client";

import { Button } from "@/components/input/button";
import { useSend } from "@/hooks/useSend";
import { AppEvent } from "@/types";
import { ComponentProps, forwardRef, useCallback } from "react";

// Define a new prop type that includes the appEvent payload
type EventButtonProps = ComponentProps<typeof Button> & {
  event: AppEvent;
};

export const EventButton = forwardRef<HTMLButtonElement, EventButtonProps>(
  ({ children, event: appEvent, ...rest }, ref) => {
    const send = useSend();

    // Modify the handleClick to use the appEvent prop
    const handleClick = useCallback(() => {
      send(appEvent);
    }, [send, appEvent]);

    return (
      <button
        onClick={handleClick}
        ref={ref}
        {...rest}
        className="bg-transparent border-none p-0 m-0 text-inherit font-inherit align-baseline"
      >
        {children}
      </button>
    );
  }
);
EventButton.displayName = "EventButton";
