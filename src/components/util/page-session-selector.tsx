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

interface PageSessionSelectorComponentProps {
  selector: (snapshot: PageSessionSnapshot) => boolean;
  children: ReactNode;
  not?: boolean;
}

export const pageSessionSelectorComponent = (
  selector: (snapshot: PageSessionSnapshot) => boolean
) => {
  const Component = ({ children, not }: PageSessionSelectorComponentProps) => {
    const selectedValue = usePageSessionSelector(selector);
    return (!not && selectedValue) || (not && !selectedValue) ? (
      <>{children}</>
    ) : (
      <></>
    );
  };

  Component.displayName = `PageSessionSelectorComponent(${selector.toString()})`;
  return Component;
};
