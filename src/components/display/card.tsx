"use client";

import * as React from "react";

import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import { AppEvent } from "@/types";
import { cva } from "class-variance-authority";

const cardVariants = cva(
  "rounded-lg shadow-sm transition-colors focus-within:outline-none bg-card text-card-foreground",
  {
    variants: {
      variant: {
        default: "border",
        interactive:
          "border active:bg-slate-200 hover:bg-slate-100 dark:active:bg-slate-800 dark:hover:bg-slate-900 focus-within:outline focus-within:outline-2 focus-within:outline-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    event?: AppEvent;
    variant?: "interactive" | "default";
  }
>(({ className, event, variant = "default", ...props }, ref) => {
  const send = useSend();

  const handleClick = React.useMemo(() => {
    if (event && !props.onClick) {
      const handler: React.MouseEventHandler<HTMLDivElement> = (e) => {
        console.log("Hello");
        send(event);
        e.preventDefault();
      };
      return handler;
    } else {
      return props.onClick;
    }
  }, [event, props.onClick, send]);

  return (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      onClick={handleClick}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
