"use client";
import { useStore } from "@nanostores/react";
import { Slot } from "@radix-ui/react-slot";
import { atom } from "nanostores";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { twc } from "react-twc";
import { Popover, PopoverContent, PopoverTrigger } from "./layout/popover";

interface HighlightProps {
  open: boolean;
  onOpenChange?: (value: boolean) => void;
  children: ReactNode;
  duration?: number;
  className?: string;
}

const HighlightContext = createContext(atom(false));

export const Highlight: React.FC<HighlightProps> = ({ open, children }) => {
  const [store] = useState(atom(open));
  useEffect(() => {
    store.set(open);
  }, [store, open]);
  return (
    <HighlightContext.Provider value={store}>
      <Popover open={open}>{children}</Popover>
    </HighlightContext.Provider>
  );
};

export const HighlightTarget = ({ children }: { children: ReactNode }) => {
  const store = useContext(HighlightContext);
  const isActive = useStore(store);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && ref.current) {
      const element = ref.current;
      const elementRect = element.getBoundingClientRect();
      const isFullyVisible = 
        elementRect.top >= 0 &&
        elementRect.left >= 0 &&
        elementRect.bottom <= window.innerHeight &&
        elementRect.right <= window.innerWidth;

      if (!isFullyVisible) {
        const scrollY = window.scrollY + elementRect.top - window.innerHeight / 2 + elementRect.height / 2;
        window.scrollTo({
          top: scrollY,
          behavior: 'smooth'
        });
      }
    }
  }, [isActive]);

  return isActive ? (
    <PopoverTrigger asChild>
      <Slot
        ref={ref}
        className="z-90"
        style={{
          position: "relative",
          borderRadius: "0.25rem",
          boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6)`,
          transition: `border-color 300ms ease-in-out, box-shadow 300ms ease-in-out`,
        }}
      >
        {children}
      </Slot>
    </PopoverTrigger>
  ) : (
    <>{children}</>
  );
};

export const HighlightContent = twc(PopoverContent)`z-100 max-w-[95vw] p-2`;