import { PageSessionSnapshot } from "@/app/page-session-store";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { ReactNode, useSyncExternalStore } from "react";

interface SessionSnapshotConditionalRendererProps {
  selector: (snapshot: PageSessionSnapshot) => boolean;
  children: ReactNode;
  initialValueOverride?: boolean;
}

export const PageSessionSnapshotConditionalRenderer = (
  props: SessionSnapshotConditionalRendererProps
) => {
  const session$ = usePageSessionStore();

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
