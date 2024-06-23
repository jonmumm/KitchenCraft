"use client";
import { PageSessionSnapshot } from "@/app/page-session-machine";
import { AppSnapshot } from "@/app/app-machine";
import { useCombinedSelector } from "@/hooks/useCombinedSelector";
import { ReactNode } from "react";

interface CombinedSelectorProps<T> {
  selector: (appSnapshot: AppSnapshot, pageSessionSnapshot: PageSessionSnapshot) => T;
  children: ReactNode;
  initialValueOverride?: T;
  not?: boolean;
}

export const CombinedSelector = <T,>(props: CombinedSelectorProps<T>) => {
  const selectedValue = useCombinedSelector(props.selector);
  const initialValue =
    typeof props.initialValueOverride !== "undefined"
      ? props.initialValueOverride
      : selectedValue;
  const shouldRender = props.not ? !initialValue : !!initialValue;
  return shouldRender ? <>{props.children}</> : <></>;
};

type CombinedSelectorComponentProps = Omit<CombinedSelectorProps<boolean>, 'selector'>;

export const combinedSelectorComponent = (
  selector: (appSnapshot: AppSnapshot, pageSessionSnapshot: PageSessionSnapshot) => boolean
) => {
  const Component = ({ children, not, initialValueOverride }: CombinedSelectorComponentProps) => (
    <CombinedSelector 
      selector={selector}
      not={not}
      initialValueOverride={initialValueOverride}
    >
      {children}
    </CombinedSelector>
  );
  Component.displayName = `CombinedSelectorComponent(${selector.toString()})`;
  return Component;
};