"use client";

import { PageSessionSnapshot } from "@/app/page-session-machine";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { ReactNode } from "react";

interface PageSessionSelectorProps<T> {
  selector: (snapshot: PageSessionSnapshot) => T;
  children: ReactNode;
  initialValueOverride?: T;
}

export const PageSessionSelector = <T,>(props: PageSessionSelectorProps<T>) => {
  const selectedValue = usePageSessionSelector(props.selector);

  const initialValue =
    typeof props.initialValueOverride !== "undefined"
      ? props.initialValueOverride
      : selectedValue;

  return initialValue ? <>{props.children}</> : <></>;
};
