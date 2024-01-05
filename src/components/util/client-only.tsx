"use client";

// https://twitter.com/TkDodo/status/1741068994981826947/photo/2
import { ReactNode, useSyncExternalStore } from "react";

const ClientOnly = ({ children }: { children: ReactNode }) => {
  const value = useSyncExternalStore(
    () => () => {},
    () => "c",
    () => "s"
  );

  return value === "s" ? null : <>{children}</>;
};

export default ClientOnly;
