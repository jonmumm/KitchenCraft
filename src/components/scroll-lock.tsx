"use client";

import { cn } from "@/lib/utils";
import { ReactNode, forwardRef, useEffect, useRef } from "react";

export const useScrollLock = (isActive: boolean) => {
  const scrollTopRef = useRef(0);
  useEffect(() => {
    if (isActive) {
      scrollTopRef.current = window.scrollY;
      document.body.style.overflow = "hidden";
      // document.body.style.overscrollBehavior = "none";
      document.body.style.position = "fixed";
      document.body.style.height = "100%";
      document.body.style.width = "100%";
      return () => {
        // document.body.style.overscrollBehavior = "";
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.height = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollTopRef.current);
      };
    }
  }, [isActive]);
};

const ScrollLockComponent = forwardRef<
  HTMLDivElement,
  { children: ReactNode; active: boolean; className?: string }
>(({ children, active, className }, ref) => {
  useScrollLock(active);

  return (
    <div
      ref={ref}
      className={cn(
        active ? `overflow-auto h-screen pointer-events-auto` : ``,
        className
      )}
    >
      {children}
    </div>
  );
});

ScrollLockComponent.displayName = "ScrollLockComponent";

export default ScrollLockComponent;
