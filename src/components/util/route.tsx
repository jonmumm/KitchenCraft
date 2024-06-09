"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export const Route = ({
  pathname,
  children,
}: {
  pathname: string;
  children: ReactNode;
}) => {
  const currentPath = usePathname();
  return pathname === currentPath ? <>{children}</> : <></>;
};
