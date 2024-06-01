"use client";

import { AppEvent } from "@/types";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 active:opacity-70",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 active:opacity-70",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 active:opacity-70",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80 active:opacity-70",
        warningOutline:
          "border-warning text-warning-foreground hover:bg-warning/80 active:opacity-70",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80 active:opacity-70",
        successOutline:
          "border-success text-success-foreground hover:bg-success/80 active:opacity-70",
        outline: "text-foreground active:opacity-70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({
  className,
  variant,
  event,
  onClickOnEvent,
  ...props
}: BadgeProps & { event?: AppEvent; onClickOnEvent?: boolean }) {
  const send = useSend();
  const handleClick = React.useMemo(() => {
    if (event) {
      const handler: React.MouseEventHandler<HTMLDivElement> = (e) => {
        send(event);
        e.preventDefault();
        e.stopPropagation();
      };
      return handler;
    } else {
      return props.onClick;
    }
  }, [event, props, send]);
  const cursor = event ? "cursor-pointer" : "";

  return (
    <div
      className={cn(badgeVariants({ variant }), className, cursor)}
      {...props}
      onClick={handleClick}
    />
  );
}

export { Badge, badgeVariants };
