"use client";

import { AppSnapshot } from "@/app/app-machine";
import { useAppSelector } from "@/hooks/useAppSelector";
import { ReactNode } from "react";

interface AppSelectorProps<T> {
  selector: (snapshot: AppSnapshot) => T;
  children: ReactNode;
  initialValueOverride?: T;
}

export const AppSelector = <T,>(props: AppSelectorProps<T>) => {
  const selectedValue = useAppSelector(props.selector);

  const initialValue =
    typeof props.initialValueOverride !== "undefined"
      ? props.initialValueOverride
      : selectedValue;

  return initialValue ? <>{props.children}</> : <></>;
};
