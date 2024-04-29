import { SessionSnapshot } from "@/app/page-session-store";
import { useSessionStore } from "@/hooks/useSessionStore";
import { ReactNode, useSyncExternalStore } from "react";

interface SessionSnapshotConditionalRendererProps {
  selector: (snapshot: SessionSnapshot) => boolean;
  children: ReactNode;
  initialValueOverride?: boolean;
}

export const PageSessionSnapshotConditionalRenderer = (
  props: SessionSnapshotConditionalRendererProps
) => {
  const session$ = useSessionStore();

  const active = useSyncExternalStore(
    session$.subscribe,
    () => props.selector(session$.get()),
    () => {
      return typeof props.initialValueOverride === "boolean"
        ? props.initialValueOverride
        : props.selector(session$.get());
    }
  );

  return active ? <>{props.children}</> : <></>;
};
