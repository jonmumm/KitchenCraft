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

export type TailwindWidth =
  | "w-1"
  | "w-2"
  | "w-3"
  | "w-4"
  | "w-5"
  | "w-6"
  | "w-8"
  | "w-10"
  | "w-12"
  | "w-16"
  | "w-20"
  | "w-24"
  | "w-32"
  | "w-40"
  | "w-48"
  | "w-56"
  | "w-64";

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  medianWidth?: TailwindWidth;
}

const tailwindWidths: TailwindWidth[] = [
  "w-1", "w-2", "w-3", "w-4", "w-5", "w-6", "w-8", "w-10", "w-12",
  "w-16", "w-20", "w-24", "w-32", "w-40", "w-48", "w-56", "w-64",
];

function getRandomWidthClass(medianWidth: TailwindWidth = "w-12") {
  const medianIndex = tailwindWidths.indexOf(medianWidth);
  let rand = 0;
  for (let i = 0; i < 6; i += 1) {
    rand += Math.random();
  }
  rand = rand - 3; // Standardize
  let index = Math.round(medianIndex + rand);
  index = Math.max(0, Math.min(index, tailwindWidths.length - 1));
  return tailwindWidths[index];
}

function Skeleton({ 
  className, 
  animation, 
  medianWidth = "w-12", 
  ...props 
}: SkeletonProps) {
  const widthClass = getRandomWidthClass(medianWidth);
  return (
    <div
      className={cn(skeletonVariants({ animation }), widthClass, className)}
      {...props}
    />
  );
}

export function SkeletonSentence({
  className,
  numWords,
  animation,
  medianWidth = "w-12",
  containerClassName,
  ...props
}: SkeletonProps & {
  numWords: number | number[];
  containerClassName?: string;
}) {
  let wordCount;
  if (Array.isArray(numWords)) {
    const randomIndex = Math.floor(Math.random() * numWords.length);
    wordCount = numWords[randomIndex];
  } else {
    wordCount = numWords;
  }

  return (
    <div className={cn(containerClassName, `flex flex-row gap-1 flex-wrap`)}>
      {new Array(wordCount).fill(0).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(className)}
          medianWidth={medianWidth}
          animation={animation}
          suppressHydrationWarning
          {...props}
        />
      ))}
    </div>
  );
}

export { Skeleton };