import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

// Define the base style and variants for the Skeleton component
const skeletonVariants = cva(
  "rounded-md bg-muted", // base style
  {
    variants: {
      animation: {
        pulse: "animate-pulse",
        none: "", // no animation
      },
    },
    defaultVariants: {
      animation: "pulse", // default to pulse animation
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, animation, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ animation }), className)}
      {...props}
    />
  );
}

export { Skeleton };
