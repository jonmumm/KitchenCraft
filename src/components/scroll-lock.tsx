"use client";

import { ReactNode, forwardRef, useEffect, useRef } from "react";

export const useScrollLock = (isActive: boolean) => {
  const scrollTopRef = useRef(0);
  useEffect(() => {
    if (isActive) {
      scrollTopRef.current = window.scrollY;
      document.body.style.overflow = "auto";
      document.body.style.position = "fixed";
      document.body.style.height = "100%";
      document.body.style.width = "100%";
      return () => {
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
