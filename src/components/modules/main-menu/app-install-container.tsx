"use client";

import { getPlatformInfo } from "@/lib/device";
import { ReactNode, useSyncExternalStore } from "react";

const empty = () => {
  return () => {};
};

export const AppInstallContainer = ({ children }: { children: ReactNode }) => {
  const installed = useSyncExternalStore(
    empty,
    () => {
      const { isInPWA } = getPlatformInfo(navigator.userAgent);
      return isInPWA;
    },
    () => {
      return undefined;
    }
  );

  return !installed ? <>{children}</> : null;
};
