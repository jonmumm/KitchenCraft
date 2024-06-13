"use client";

import { PageSessionState } from "@/app/page-session-machine";
import { usePageSessionMatchesState } from "@/hooks/usePageSessionMatchesState";
import { ReactNode } from "react";

interface PageSessionMatches {
  matchedState: PageSessionState;
  children: ReactNode;
  initialValueOverride?: boolean;
}

export const PageSessionMatches = (props: PageSessionMatches) => {
  const active = usePageSessionMatchesState(props.matchedState);

  const initialValue =
    typeof props.initialValueOverride === "boolean"
      ? props.initialValueOverride
      : active;

  return initialValue ? <>{props.children}</> : <></>;
};
