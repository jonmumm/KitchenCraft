import { PageSessionSnapshot } from "@/app/page-session-machine";
import { usePageSessionStore } from "./usePageSessionStore";
import { useSyncExternalStore } from "react";

export const usePageSessionSelector = <T>(
  selector: (snapshot: PageSessionSnapshot) => T
) => {
  const store = usePageSessionStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get())
  );
};
