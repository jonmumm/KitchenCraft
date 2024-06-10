"use client";

import type { UserState } from "@/app/user-machine";
import { useUserMatchesState } from "@/hooks/useUserMatchesState";
import { ReactNode, useLayoutEffect, useState } from "react";

interface UserSnapshotConditionalRendererProps {
  matchedState: UserState;
  children: ReactNode;
  initialValueOverride?: boolean;
  not?: boolean;
}

export const UserSnapshotConditionalRenderer = (
  props: UserSnapshotConditionalRendererProps
) => {
  const active = useUserMatchesState(props.matchedState);
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
