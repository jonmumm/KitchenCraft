"use client";

import { useStore } from "@nanostores/react";
import { Slot } from "@radix-ui/react-slot";
import { atom } from "nanostores";
import React, { ReactNode, createContext, useContext, useState } from "react";
import { twc } from "react-twc";
import { Popover, PopoverContent, PopoverTrigger } from "./layout/popover";

interface HighlightProps {
  active: boolean;
  children: ReactNode;
  duration?: number;
  className?: string;
}

const HighlightContext = createContext(atom(false));

export const Highlight: React.FC<HighlightProps> = ({ active, children }) => {
  const [store] = useState(atom(active));

  return (
    <HighlightContext.Provider value={store}>
      <Popover open={active}>{children}</Popover>
    </HighlightContext.Provider>
  );
};

export const HighlightTarget = ({ children }: { children: ReactNode }) => {
  const store = useContext(HighlightContext);
  const isActive = useStore(store);
  return isActive ? (
    <PopoverTrigger asChild>
      <Slot
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

export const HighlightContent = twc(PopoverContent)`z-100`;
