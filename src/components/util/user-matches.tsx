"use client";
import type { UserState } from "@/app/user-machine";
import { userMatchesState } from "@/utils/user-matches";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { DeepPartial } from "@/lib/types";
import { ReactNode, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { matchesState, StateValue } from "xstate";
import { useUserMatchesState } from "@/hooks/useUserMatchesState";

// Type that represents either a UserState or an XState StateValue

// Function to check if a state matches a given state value

// Hook for checking if user state matches
interface UserMatchesProps {
  matchedState: UserState;
  and?: UserState;
  or?: UserState;
  children: ReactNode;
  initialValueOverride?: boolean;
  not?: boolean;
}

export const UserMatches = (props: UserMatchesProps) => {
  const active = useUserMatchesState(props.matchedState);
  const matchesAnd = useUserMatchesState(props.and || {});
  const matchesOr = useUserMatchesState(props.or || {});
  const [overrideValue, setOverrideValue] = useState(
    props.initialValueOverride
  );

  useLayoutEffect(() => {
    setOverrideValue(undefined);
  }, [props.initialValueOverride]);

  const andActive = props.and ? matchesAnd : true;
  const orActive = props.or ? matchesOr : false;

  const value =
    typeof overrideValue === "boolean"
      ? overrideValue
      : (active && andActive) || orActive;

  const finalValue = props.not ? !value : value;

  return finalValue ? <>{props.children}</> : null;
};

export const userMatchesComponent = (
  matchedState: UserState,
  andState?: UserState,
  orState?: UserState
) => {
  const Component = ({
    children,
    not,
    initialValueOverride,
  }: Omit<UserMatchesProps, "matchedState" | "and" | "or">) => (
    <UserMatches
      matchedState={matchedState}
      and={andState}
      or={orState}
      not={not}
      initialValueOverride={initialValueOverride}
    >
      {children}
    </UserMatches>
  );
  Component.displayName = `UserMatchesComponent(${JSON.stringify(matchedState)})`;
  return Component;
};