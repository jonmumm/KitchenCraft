"use client";

import { PageSessionState } from "@/app/page-session-machine";
import { usePageSessionMatchesState } from "@/hooks/usePageSessionMatchesState";
import { ReactNode } from "react";

interface PageSessionMatchesProps {
  matchedState: PageSessionState;
  and?: PageSessionState;
  or?: PageSessionState;
  not?: boolean;
  children: ReactNode;
  initialValueOverride?: boolean;
}

export const PageSessionMatches = (props: PageSessionMatchesProps) => {
  const active = usePageSessionMatchesState(props.matchedState);
  const matchesAnd = usePageSessionMatchesState(props.and || {});
  const matchesOr = usePageSessionMatchesState(props.or || {});

  const andActive = props.and ? matchesAnd : true;
  const orActive = props.or ? matchesOr : false;

  const value =
    typeof props.initialValueOverride === "boolean"
      ? props.initialValueOverride
      : (active && andActive) || orActive;

  const finalValue = props.not ? !value : value;

  return finalValue ? <>{props.children}</> : null;
};
