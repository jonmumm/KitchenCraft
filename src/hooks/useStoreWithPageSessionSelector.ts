import { PageSessionSnapshot } from "@/app/page-session-machine";
import { useStore } from "@nanostores/react";
import { useSyncExternalStore } from "react";
import { usePageSessionStore } from "./usePageSessionStore";
import { ReadableAtom } from "nanostores";

export function useStoreWithPageSessionSelector<S, T>(
  store: ReadableAtom<S>,
  selector: (storeValue: S, pageSnapshot: PageSessionSnapshot) => T,
  ssrSelector?: (storeValue: S, pageSnapshot: PageSessionSnapshot) => T
) {
  const storeValue = useStore(store);
  const pageSessionStore = usePageSessionStore();

  return useSyncExternalStore(
    (callback) => {
      const unsubscribeStore = store.subscribe(callback);
      const unsubscribePageSession = pageSessionStore.subscribe(callback);
      return () => {
        unsubscribeStore();
        unsubscribePageSession();
      };
    },
    () => selector(storeValue, pageSessionStore.get()),
    () =>
      ssrSelector
        ? ssrSelector(storeValue, pageSessionStore.get())
        : selector(storeValue, pageSessionStore.get())
  );
}
