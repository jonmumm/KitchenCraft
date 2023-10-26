import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

export const ShareButton = (props: { children: ReactNode }) => {
  return (
    typeof window !== "undefined" &&
    !!window.navigator?.canShare && (
      <Button
        suppressHydrationWarning
        variant="outline"
        className="flex flex-row gap-1"
        aria-label="Share"
        // onClick={handlePressShare}
      >
        {props.children}
      </Button>
    )
  );
};
