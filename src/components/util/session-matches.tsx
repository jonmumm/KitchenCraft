"use client";

import { SessionState } from "@/app/session-machine";
import { useSessionMatchesState } from "@/hooks/useSessionMatchesState";
import { ReactNode, useLayoutEffect, useState } from "react";

interface SessionSnapshotConditionalRendererProps {
  matchedState: SessionState;
  children: ReactNode;
  initialValueOverride?: boolean;
  not?: boolean;
}

export const SessionSnapshotMatches = (
  props: SessionSnapshotConditionalRendererProps
) => {
  const active = useSessionMatchesState(props.matchedState);
  const [overrideValue, setOverrideValue] = useState(
    props.initialValueOverride
  );

  useLayoutEffect(() => {
    setOverrideValue(undefined);
  }, [props.initialValueOverride]);

  const value =
    typeof overrideValue === "boolean"
      ? overrideValue
      : (active && !props.not) || (props.not && !active);

  return value ? <>{props.children}</> : <></>;
};
