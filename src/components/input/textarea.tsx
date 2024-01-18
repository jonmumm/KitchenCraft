"use client";

import * as React from "react";

import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps & { sendChange?: boolean }
>(({ className, sendChange, ...props }, ref) => {
  const send = useSend();
  const { name, onChange } = props;

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> =
    useCallback(
      (e) => {
        if (sendChange && name) {
          send({ type: "CHANGE", name, value: e.currentTarget.value });
        }

        if (onChange) {
          onChange(e as any);
        }
      },
      [send, sendChange, name, onChange]
    );

  return (
    <textarea
      name={name}
      onChange={handleChange}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-md ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        // "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
