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

export const AppMatches = (
  props: AppMatchesProps
) => {
  const active = useAppMatchesState(props.matchedState);

  const value =
    typeof props.initialValueOverride === "boolean"
      ? props.initialValueOverride
      : (active && !props.not) || (props.not && !active);

  return value ? <>{props.children}</> : <></>;
};
