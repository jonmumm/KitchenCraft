"use client";
import type { UserState } from "@/app/user-machine";
import { useUserMatchesState } from "@/hooks/useUserMatchesState";
import { ReactNode, useLayoutEffect, useState } from "react";

interface UserMatchesProps {
  matchedState: UserState;
  children: ReactNode;
  initialValueOverride?: boolean;
  not?: boolean;
}

export const UserMatches = (props: UserMatchesProps) => {
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
  return value ? <>{props.children}</> : null;
};

export const userMatchesComponent = (matchedState: UserState) => {
  const Component = ({
    children,
    not,
    initialValueOverride,
  }: Omit<UserMatchesProps, "matchedState">) => (
    <UserMatches
      matchedState={matchedState}
      not={not}
      initialValueOverride={initialValueOverride}
    >
      {children}
    </UserMatches>
  );
  Component.displayName = `UserMatchesComponent(${matchedState.toString()})`;
  return Component;
};
