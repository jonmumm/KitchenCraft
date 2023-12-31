import { ReactNode, forwardRef, useEffect } from "react";

const useScrollLock = (isActive: boolean) => {
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
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
    <div ref={ref} className="overflow-auto max-h-screen">
      {children}
    </div>
  );
});

ScrollLockComponent.displayName = "ScrollLockComponent";

export default ScrollLockComponent;
