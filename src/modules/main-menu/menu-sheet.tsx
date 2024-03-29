"use client";

import { Sheet } from "@/components/layout/sheet";
import { useEventHandler } from "@/hooks/useEventHandler";
import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
import { usePathname } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";

export function MenuSheet({ children }: { children: ReactNode }) {
  const [open$] = useState(atom(false));
  const open = useStore(open$);

  const handleDownloadApp = useCallback(() => {
    open$.set(false);
  }, [open$]);

  useEventHandler("DOWNLOAD_APP", handleDownloadApp);

  const pathname = usePathname();

  useEffect(() => {
    open$.set(false);
  }, [pathname, open$]);

  return (
    <Sheet open={open} onOpenChange={open$.set}>
      {children}
    </Sheet>
  );
}
