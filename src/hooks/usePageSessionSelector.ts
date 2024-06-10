import { PageSessionSnapshot } from "@/app/page-session-machine";
import { useSyncExternalStore } from "react";
import { usePageSessionStore } from "./usePageSessionStore";

export const usePageSessionSelector = <T>(
  selector: (snapshot: PageSessionSnapshot) => T,
  ssrSelector?: (snapshot: PageSessionSnapshot) => T
) => {
  const store = usePageSessionStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => (ssrSelector ? ssrSelector(store.get()) : selector(store.get()))
  );
};
