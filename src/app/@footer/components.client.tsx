"use client";

import { Card } from "@/components/display/card";
import { useSelector } from "@/hooks/useSelector";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CraftContext } from "../context";
import { useCraftIsOpen } from "@/hooks/useCraftIsOpen";

export const FooterTabTitle = ({
  children,
  isActive,
}: {
  children: ReactNode;
  isActive: boolean;
}) => {
  const craftIsOpen = useCraftIsOpen();

  return (
    <span
      className={`text-xs ${
        !craftIsOpen && isActive
          ? `text-blue-700 font-semibold`
          : `text-muted-foreground font-medium`
      } truncate w-full text-center`}
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
    <div
      className={cn(
        "fixed z-50 bottom-0 left-0 right-0 flex rounded-b-none transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CraftTabLink = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const pathname = usePathname();
  return (
    <Link
      href={`${pathname}?crafting=1`}
      shallow
      className={cn("basis-32", className)}
    >
      {children}
    </Link>
  );
};

export const CraftTabTitle = () => {
  const actor = useContext(CraftContext);
  const isOpen = useSelector(actor, (state) => {
    return state.matches("Open.True");
  });
  return (
    <span
      className={`text-xs ${
        isOpen
          ? `text-blue-700 font-semibold`
          : `text-muted-foreground font-medium`
      } truncate w-full text-center`}
    >
      Craft
    </span>
  );
};
