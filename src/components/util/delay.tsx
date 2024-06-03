import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import React, { ReactNode, useEffect, useState } from "react";

interface DelayProps {
  delay: number;
  className?: string;
  children: ReactNode;
}

const Delay: React.FC<DelayProps> = ({ className, delay, ...props }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    // Cleanup the timer if the component is unmounted before the delay finishes
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Slot
      className={cn(
        className,
        "transition-opacity duration-500", // Add transition and duration classes
        isVisible ? "opacity-1" : "opacity-0"
      )}
      {...props}
    />
  );
};

export default Delay;
