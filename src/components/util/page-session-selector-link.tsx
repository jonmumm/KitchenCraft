"use client";

import { PageSessionSnapshot } from "@/app/page-session-machine";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import Link from "next/link";
import { ComponentProps, ReactNode } from "react";

type SelectorFunction = (state: PageSessionSnapshot) => string | undefined;

type PageSessionSelectorLinkProps = {
  selector: SelectorFunction;
  children: ReactNode;
  fallbackHref?: string;
} & Omit<ComponentProps<typeof Link>, "href">;

export const PageSessionSelectorLink = ({
  selector,
  children,
  fallbackHref,
  ...props
}: PageSessionSelectorLinkProps) => {
  const href = usePageSessionSelector(selector);

  return href ? (
    <Link {...props} href={href}>
      {children}
    </Link>
  ) : fallbackHref ? (
    <Link {...props} href={fallbackHref}>
      {children}
    </Link>
  ) : (
    <>{children}</>
  );
};
