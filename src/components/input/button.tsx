"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import { AppEvent } from "@/types";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:opacity-70",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:opacity-70",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:opacity-70",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:opacity-70",
        ghost: "hover:bg-accent hover:text-accent-foreground active:opacity-70",
        link: "text-primary underline-offset-4 hover:underline active:opacity-70",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        fit: "w-full h-100",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { event?: AppEvent }
>(({ className, variant, size, event, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  const send = useSend();

  const handleClick = React.useMemo(() => {
    if (event && !props.onClick) {
      const handler: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        send(event);
        e.preventDefault();
      };
      return handler;
    } else {
      return props.onClick;
    }
  }, [event, props.onClick, send]);

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
