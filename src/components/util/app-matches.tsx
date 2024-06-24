"use client";
import type { AppState } from "@/app/app-machine";
import { useAppMatchesState } from "@/hooks/useAppMatchesState";
import { ReactNode } from "react";

interface AppMatchesProps {
  matchedState: AppState;
  children: ReactNode;
  initialValueOverride?: boolean;
  not?: boolean;
}

export const AppMatches = (props: AppMatchesProps) => {
  const active = useAppMatchesState(props.matchedState);
  const value =
    typeof props.initialValueOverride === "boolean"
      ? props.initialValueOverride
      : (active && !props.not) || (props.not && !active);
  return value ? <>{props.children}</> : null;
};

export const appMatchesComponent = (matchedState: AppState) => {
  const Component = ({
    children,
    not,
    initialValueOverride,
  }: Omit<AppMatchesProps, "matchedState">) => (
    <AppMatches
      matchedState={matchedState}
      not={not}
      initialValueOverride={initialValueOverride}
    >
      {children}
    </AppMatches>
  );

  Component.displayName = `AppMatchesComponent(${matchedState.toString()})`;
  return Component;
};
