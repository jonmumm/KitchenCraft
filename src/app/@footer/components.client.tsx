"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Card } from "@/components/display/card";
import { cn } from "@/lib/utils";
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from "next/navigation";

export const FooterTabTitle = ({ children }: { children: ReactNode }) => {
  const segments = useSelectedLayoutSegments();
  console.log({ segments });
  const isActive = false;
  return (
    <span
      className={`text-xs ${
        isActive
          ? `text-blue-700 font-semibold`
          : `text-muted-foreground font-medium`
      }`}
    >
      {children}
    </span>
  );
};

export const ReactiveFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollTop = useRef(0);
  const THRESHOLD = 100; // Set your threshold value here
  const SPEED_THRESHOLD = 10; // Set your speed threshold here

  const handleScroll = useCallback(() => {
    const currentScrollTop =
      window.pageYOffset || document.documentElement.scrollTop;

    if (
      currentScrollTop > lastScrollTop.current &&
      currentScrollTop > THRESHOLD
    ) {
      setIsVisible(false);
    } else if (
      Math.abs(currentScrollTop - lastScrollTop.current) > SPEED_THRESHOLD
    ) {
      setIsVisible(true);
    }
    lastScrollTop.current = currentScrollTop <= 0 ? 0 : currentScrollTop;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <Card
      className={cn(
        "fixed z-50 bottom-0 left-0 right-0 shadow-inner flex rounded-b-none transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full",
        className
      )}
    >
      {children}
    </Card>
  );
};
