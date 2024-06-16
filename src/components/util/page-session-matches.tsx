"use client";

import { PageSessionState } from "@/app/page-session-machine";
import { usePageSessionMatchesState } from "@/hooks/usePageSessionMatchesState";
import { ReactNode } from "react";

interface PageSessionMatches {
  matchedState: PageSessionState;
  and?: PageSessionState;
  or?: PageSessionState;
  children: ReactNode;
  initialValueOverride?: boolean;
}

export const PageSessionMatches = (props: PageSessionMatches) => {
  const active = usePageSessionMatchesState(props.matchedState);
  const andActive = props.and ? usePageSessionMatchesState(props.and) : true;
  const orActive = props.or ? usePageSessionMatchesState(props.or) : false;

  const value =
    typeof props.initialValueOverride === "boolean"
      ? props.initialValueOverride
      : (active && andActive) || orActive;

  return value ? <>{props.children}</> : <></>;
};
