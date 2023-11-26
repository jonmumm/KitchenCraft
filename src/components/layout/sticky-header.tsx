"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import ResizeObserverComponent from "../resize-observer";
import { cn } from "@/lib/utils";

const StickyHeader = ({ children }: { children: ReactNode }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    setIsScrolled(scrollTop > 0);
  }, [setIsScrolled]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const handleResize = useCallback(
    (size: { width: number; height: number }) => {
      setHeaderHeight(size.height);
    },
    [setHeaderHeight]
  );
  console.log({ headerHeight, isScrolled });

  return (
    <>
      {isScrolled && (
        <div className="spacer" style={{ height: headerHeight }} />
      )}
      <ResizeObserverComponent onResize={handleResize}>
        <header
          className={cn(
            isScrolled ? "fixed right-0 top-0 left-0 px-4 py-3 bg-primary-foreground" : ""
          )}
        >
          {children}
        </header>
      </ResizeObserverComponent>
    </>
  );
};

export default StickyHeader;
