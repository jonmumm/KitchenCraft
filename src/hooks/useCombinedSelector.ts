import { AppSnapshot } from "@/app/app-machine";
import { PageSessionSnapshot } from "@/app/page-session-machine";
import { useSyncExternalStore } from "react";
import { useAppContext } from "./useAppContext";
import { usePageSessionStore } from "./usePageSessionStore";

export const useCombinedSelector = <T>(
  selector: (
    appSnapshot: AppSnapshot,
    pageSessionSnapshot: PageSessionSnapshot
  ) => T,
  ssrSelector?: (
    appSnapshot: AppSnapshot,
    pageSessionSnapshot: PageSessionSnapshot
  ) => T
) => {
  const pageSessionStore = usePageSessionStore();
  const appActor = useAppContext();

  return useSyncExternalStore(
    (callback) => {
      const actorSub = appActor.subscribe(callback);
      const unsubscribePageSession = pageSessionStore.subscribe(callback);
      return () => {
        actorSub.unsubscribe();
        unsubscribePageSession();
      };
    },
    () => selector(appActor.getSnapshot(), pageSessionStore.get()),
    () =>
      ssrSelector
        ? ssrSelector(appActor.getSnapshot(), pageSessionStore.get())
        : selector(appActor.getSnapshot(), pageSessionStore.get())
  );
};
