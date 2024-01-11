"use client";

import { useCraftIsOpen, usePromptIsDirty } from "@/hooks/useCraftIsOpen";
import { useSelector } from "@/hooks/useSelector";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, useContext, useEffect, useRef } from "react";
import { toast } from "sonner";
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

export const Body = ({
  children,
  isPWA,
}: {
  children: ReactNode;
  isPWA: boolean;
}) => {
  const craftIsOpen = useCraftIsOpen();
  const promptIsDirty = usePromptIsDirty();

  return (
    <body
      className={`${inter.className} overflow-x-hidden pb-16 ${
        craftIsOpen ? `crafting` : ``
      }
      ${promptIsDirty ? `prompt-dirty` : ``}

      ${isPWA ? `pwa` : ``}
      `}
      suppressHydrationWarning
    >
      {children}
    </body>
  );
};

export const SearchParamsToastMessage = () => {
  const consumedParamsMapRef = useRef(new Map());
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentPathnameRef = useRef(pathname);

  useEffect(() => {
    if (currentPathnameRef.current !== pathname) {
      consumedParamsMapRef.current.clear();
      currentPathnameRef.current = pathname;
    }
  }, [pathname, currentPathnameRef]);

  useEffect(() => {
    if (!consumedParamsMapRef.current.get("message")) {
      consumedParamsMapRef.current.set("message", true);
      const message = searchParams.get("message");
      if (message) {
        toast(message);
      }
    }
  }, [searchParams, consumedParamsMapRef]);

  return <></>;
};
