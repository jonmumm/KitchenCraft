"use client";

import * as React from "react";

import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import { AppEvent } from "@/types";
import { cva } from "class-variance-authority";
import { useEffect, useImperativeHandle, useRef } from "react";
import { Label } from "./label";

const cardVariants = cva(
  "rounded-lg shadow-sm transition-colors focus-within:outline-none bg-card text-card-foreground",
  {
    variants: {
      variant: {
        default: "border",
        locontrast:
          "dark:bg-slate-800 dark:text-slate-200 bg-slate-200 text-slate-800 text-xs flex flex-col gap-1 items-end",
        medcontrast:
          "dark:bg-slate-50 dark:text-slate-700 bg-slate-950 text-slate-300 text-xs flex flex-col gap-1 items-end dark:active:bg-slate-200 dark:hover:bg-slate-100",
        hicontrast:
          "dark:bg-slate-50 dark:text-slate-700 bg-slate-950 text-slate-300 text-xs flex flex-col gap-1 items-end dark:active:bg-slate-200 dark:hover:bg-slate-100",
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
    eventOnView?: AppEvent;
    variant?: "interactive" | "default" | "hicontrast" | "locontrast" | "medcontrast";
  }
>(
  (
    { className, event, eventOnView, variant = "default", ...props },
    forwardedRef
  ) => {
    const send = useSend();
    const ref = useRef<HTMLDivElement>(null);
    useImperativeHandle(forwardedRef, () => ref.current!);

    const handleClick = React.useMemo(() => {
      if (event && !props.onClick) {
        const handler: React.MouseEventHandler<HTMLDivElement> = (e) => {
          send(event);
          e.preventDefault();
        };
        return handler;
      } else {
        return props.onClick;
      }
    }, [event, props.onClick, send]);

    useEffect(() => {
      const currentElement = ref.current;
      if (eventOnView && currentElement) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                // Trigger event when the card comes into view
                send(eventOnView);
                // Optional: Unobserve after the first trigger
                observer.unobserve(currentElement);
              }
            });
          },
          {
            // Optional: Adjust observer options (e.g., threshold, rootMargin) as needed
          }
        );

        observer.observe(currentElement);

        return () => {
          observer.disconnect();
        };
      }
    }, [eventOnView, send]);

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant }), className)}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";


const CardEyebrow = React.forwardRef<
  HTMLLabelElement,
  React.HTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn("text-xs uppercase text-muted-foreground", className)}
    {...props}
  />
));
CardEyebrow.displayName = "CardEyebrow";

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
  CardEyebrow,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
