"use client";

import { useCraftIsOpen } from "@/hooks/useCraftIsOpen";
import { useSelector } from "@/hooks/useSelector";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { ReactNode, useContext } from "react";
import { CraftContext } from "./context";

const inter = Inter({ subsets: ["latin"] });

export const HiddenIfCrafting = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const promptLength = useSelector(
    actor,
    (state) => state.context.prompt?.length || 0
  );

  return (
    <div
      className={cn(
        promptLength > 0 ? "hidden" : `block peer-focus-within:hidden`
      )}
    >
      {children}
    </div>
  );
};

export const VisibleIfCrafting = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const promptLength = useSelector(
    actor,
    (state) => state.context.prompt?.length || 0
  );

  return <div className="hidden peer-focus-within:block">{children}</div>;
};

export const Body = ({ children }: { children: ReactNode }) => {
  const craftIsOpen = useCraftIsOpen();

  return (
    <body
      className={`${inter.className} overflow-x-hidden pb-16 ${
        craftIsOpen ? `crafting` : ``
      }`}
    >
      {children}
    </body>
  );
};
