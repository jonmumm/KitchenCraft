"use client";

// In your specific TypeScript file
declare global {
  interface Window {
    removeCraftListener?: () => {}; // Optional property to handle cases where it might not be set
  }
}

import { PageSessionSelectorLink } from "@/components/util/page-session-selector-link";
import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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
        isActive ? `text-blue-600 dark:text-blue-400  font-semibold` : ``
      } crafting:text-muted-foreground crafting:font-medium truncate w-full text-center`}
    >
      {children}
    </span>
  );
};

export const SelectedLink = ({ children }: { children: ReactNode }) => {
  return (
    <PageSessionSelectorLink
      selector={(state) => {
        const profileName = state.context.userSnapshot?.context.profileName;
        return profileName
          ? `/@${state.context.userSnapshot?.context.profileName}#selected`
          : undefined;
      }}
    >
      {children}
    </PageSessionSelectorLink>
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

export const SettingsTabLink = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const send = useSend();

  useEffect(() => {
    setTimeout(() => {
      window.removeCraftListener && window.removeCraftListener();
    }, 0);
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
    </>
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
    setTimeout(() => {
      window.removeCraftListener && window.removeCraftListener();
    }, 0);
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
  return (
    <span
      suppressHydrationWarning
      className="text-xs font-medium crafting:text-blue-600 dark:crafting:text-blue-400 crafting:font-semibold truncate w-full text-center"
    >
      Craft
    </span>
  );
};
