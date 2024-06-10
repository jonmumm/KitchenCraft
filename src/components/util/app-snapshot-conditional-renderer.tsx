"use client";

import type { AppState } from "@/app/app-machine";
import { useAppMatchesState } from "@/hooks/useAppMatchesState";
import { ReactNode } from "react";

interface SessionSnapshotConditionalRendererProps {
  matchedState: AppState;
  children: ReactNode;
  initialValueOverride?: boolean;
  not?: boolean;
}

export const AppSnapshotConditionalRenderer = (
  props: SessionSnapshotConditionalRendererProps
) => {
  const active = useAppMatchesState(props.matchedState);

  const value =
    typeof props.initialValueOverride === "boolean"
      ? props.initialValueOverride
      : (active && !props.not) || (props.not && !active);

  return value ? <>{props.children}</> : <></>;
};
