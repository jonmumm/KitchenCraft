"use client";
import { SessionState } from "@/app/session-machine";
import { useSessionMatchesState } from "@/hooks/useSessionMatchesState";
import { ReactNode } from "react";

interface SessionMatchesProps {
  matchedState: SessionState;
  and?: SessionState;
  or?: SessionState;
  not?: boolean;
  children: ReactNode;
  initialValueOverride?: boolean;
}

export const SessionSnapshotMatches = (props: SessionMatchesProps) => {
  const active = useSessionMatchesState(props.matchedState);
  const matchesAnd = useSessionMatchesState(props.and || {});
  const matchesOr = useSessionMatchesState(props.or || {});
  const andActive = props.and ? matchesAnd : true;
  const orActive = props.or ? matchesOr : false;
  const value =
    typeof props.initialValueOverride === "boolean"
      ? props.initialValueOverride
      : (active && andActive) || orActive;
  const finalValue = props.not ? !value : value;
  return finalValue ? <>{props.children}</> : null;
};

export const sessionMatchesComponent = (
  matchedState: SessionState,
  andState?: SessionState,
  orState?: SessionState
) => {
  const Component = ({
    children,
    not,
    initialValueOverride,
  }: Omit<SessionMatchesProps, "matchedState" | "and" | "or">) => (
    <SessionSnapshotMatches
      matchedState={matchedState}
      and={andState}
      or={orState}
      not={not}
      initialValueOverride={initialValueOverride}
    >
      {children}
    </SessionSnapshotMatches>
  );
  Component.displayName = `SessionMatchesComponent(${matchedState.toString()})`;
  return Component;
};
