"use client";

import { ReactNode, forwardRef, useEffect } from "react";

export const useScrollLock = (isActive: boolean) => {
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = "hidden";
      document.body.style.maxHeight = "100svh";
      document.body.style.pointerEvents = "none";
      return () => {
        document.body.style.overflow = "";
        document.body.style.maxHeight = "";
        document.body.style.pointerEvents = "auto";
      };
    }
  }, [isActive]);
};

const ScrollLockComponent = forwardRef<
  HTMLDivElement,
  { children: ReactNode; active: boolean }
>(({ children, active }, ref) => {
  useScrollLock(active);

  return (
    <div
      ref={ref}
      className={active ? `overflow-auto h-screen pointer-events-auto` : ``}
    >
      {children}
    </div>
  );
});

ScrollLockComponent.displayName = "ScrollLockComponent";

export default ScrollLockComponent;
