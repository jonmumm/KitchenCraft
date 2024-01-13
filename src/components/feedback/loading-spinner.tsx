import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";

export const LoadingSpinner = ({ className }: { className?: string }) => {
  return (
    <Loader2Icon
      className={cn(
        className,
        "animate-spin transitioning:inline-block hidden"
      )}
    />
  );
};
