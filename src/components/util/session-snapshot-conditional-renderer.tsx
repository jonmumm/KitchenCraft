import { SessionState } from "@/app/session-machine";
import { useSessionMatchesState } from "@/hooks/useSessionMatchesState";
import { ReactNode } from "react";

interface SessionSnapshotConditionalRendererProps {
  matchedState: SessionState;
  children: ReactNode;
  initialValueOverride?: boolean;
  not?: boolean;
}

export const SessionSnapshotConditionalRenderer = (
  props: SessionSnapshotConditionalRendererProps
) => {
  const active = useSessionMatchesState(props.matchedState);

  const value =
    typeof props.initialValueOverride === "boolean"
      ? props.initialValueOverride
      : (active && !props.not) || (props.not && !active);

  return value ? <>{props.children}</> : <></>;
};
