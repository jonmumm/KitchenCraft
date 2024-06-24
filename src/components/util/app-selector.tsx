"use client";
import { AppSnapshot } from "@/app/app-machine";
import { useAppSelector } from "@/hooks/useAppSelector";
import { ReactNode } from "react";

interface AppSelectorProps<T> {
  selector: (snapshot: AppSnapshot) => T;
  children: ReactNode;
  initialValueOverride?: T;
  not?: boolean;
}

export const AppSelector = <T,>(props: AppSelectorProps<T>) => {
  const selectedValue = useAppSelector(props.selector);
  const initialValue =
    typeof props.initialValueOverride !== "undefined"
      ? props.initialValueOverride
      : selectedValue;
  const shouldRender = props.not ? !initialValue : !!initialValue;
  return shouldRender ? <>{props.children}</> : <></>;
};

type AppSelectorComponentProps = Omit<AppSelectorProps<boolean>, 'selector'>;

export const createAppSelector = (
  selector: (snapshot: AppSnapshot) => boolean
) => {
  const Component = ({ children, not, initialValueOverride }: AppSelectorComponentProps) => (
    <AppSelector 
      selector={selector}
      not={not}
      initialValueOverride={initialValueOverride}
    >
      {children}
    </AppSelector>
  );
  Component.displayName = `AppSelectorComponent(${selector.toString()})`;
  return Component;
};