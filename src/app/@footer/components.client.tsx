"use client";

// In your specific TypeScript file
declare global {
  interface Window {
    removeCraftListener?: () => {}; // Optional property to handle cases where it might not be set
  }
}

import { useSend } from "@/hooks/useSend";
import { assert, cn } from "@/lib/utils";
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CraftContext } from "../context";

export const FooterTabTitle = ({
  children,
  isActive,
}: {
  children: ReactNode;
  isActive: boolean;
}) => {
  return (
    <span
      className={`text-xs ${
        isActive ? `text-blue-700  font-semibold` : ``
      } crafting:text-muted-foreground crafting:font-medium truncate w-full text-center`}
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
  const send = useSend();

  useEffect(() => {
    assert(
      window.removeCraftListener,
      "expected removeCraftListener to be set when rendered"
    );
    window.removeCraftListener();
  }, []);

  const handleClick = useCallback(() => {
    send({ type: "NEW_RECIPE" });
  }, [send]);
  return (
    <>
      <div
        onClick={handleClick}
        id="craft-link"
        className={cn("basis-32 cursor-pointer", className)}
      >
        {children}
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const linkEl = document.getElementById('craft-link');

            function handleClick(event) {
              const promptEl = document.getElementById('prompt');
              if (promptEl) {
                promptEl.focus();
                event.preventDefault();
              }
            }

            function setupListeners() {
              if (linkEl) {
                linkEl.addEventListener('click', handleClick);
              } else {
                console.warn("couldn't find #craft-link element")
              }

              return function() {
                linkEl.removeEventListener('click', handleClick);
              }
            }

            var removeCraftListener = setupListeners();
          `,
        }}
      ></script>
    </>
  );
};

export const CraftTabTitle = () => {
  const actor = useContext(CraftContext);
  return (
    <span
      suppressHydrationWarning
      className="text-xs text-muted-foreground font-medium crafting:text-blue-700 crafting:font-semibold truncate w-full text-center"
    >
      Craft
    </span>
  );
};
