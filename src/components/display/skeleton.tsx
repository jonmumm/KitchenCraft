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

export function SkeletonSentence({
  className,
  numWords,
  animation,
  widths,
  containerClassName,
  ...props
}: SkeletonProps & {
  numWords: number | number[];
  widths: number[];
  containerClassName?: string;
}) {
  let wordCount;
  if (Array.isArray(numWords)) {
    const randomIndex = Math.floor(Math.random() * widths.length);
    wordCount = numWords[randomIndex];
  } else {
    wordCount = numWords;
  }

  return (
    <div className={cn(containerClassName, `flex flex-row gap-1 flex-wrap`)}>
      {new Array(wordCount).fill(0).map((_, index) => {
        const randomIndex = Math.floor(Math.random() * widths.length);
        const width = widths[randomIndex];
        return (
          <div
            key={index}
            className={cn(
              skeletonVariants({ animation }),
              className,
              `w-${width}`
            )}
            {...props}
          />
        );
      })}
    </div>
  );
}

export { Skeleton };
